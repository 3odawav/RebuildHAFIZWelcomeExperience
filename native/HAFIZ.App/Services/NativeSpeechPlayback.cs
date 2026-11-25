using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Windows.Media.Core;
using Windows.Media.Playback;
using Windows.Storage;
using HAFIZ.Core.Models;

namespace HAFIZ.App.Services;

internal sealed class NativeSpeechPlayback
{
    // Uses decoded PCM from the actual WAV and the actual player position, not simulated speech timers.
    public async Task PlayAsync(string file, byte[] wav, Action<AvatarActivityState> state,
        Action<float[],int> samples, CancellationToken ct)
    {
        var dispatcher = DispatcherQueue.GetForCurrentThread();
        using var player = new MediaPlayer { AutoPlay = false };
        var pcm = ReadPcm16(wav);
        var done = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(40) };
        timer.Tick += (_,_) =>
        {
            if (player.PlaybackSession.PlaybackState != MediaPlaybackState.Playing) return;
            var rate = pcm.Rate;
            if (rate <= 0) return;
            int offset = (int)Math.Clamp(player.PlaybackSession.Position.TotalSeconds * rate,0,pcm.Data.Length);
            int count = Math.Min(rate / 25,pcm.Data.Length-offset);
            if (count > 0) samples(pcm.Data.AsSpan(offset,count).ToArray(),rate);
        };
        bool active=true;
        player.PlaybackSession.PlaybackStateChanged += (_,_) =>
            dispatcher.TryEnqueue(() => {
                if (active && player.PlaybackSession.PlaybackState == MediaPlaybackState.Playing) state(AvatarActivityState.Speaking);
            });
        player.MediaEnded += (_,_) => done.TrySetResult(true);
        player.MediaFailed += (_,e) => done.TrySetException(new IOException(e.ErrorMessage));
        try
        {
            var storage = await StorageFile.GetFileFromPathAsync(file);
            ct.ThrowIfCancellationRequested();
            player.Source = MediaSource.CreateFromStorageFile(storage);
            timer.Start();
            player.Play();
            await done.Task.WaitAsync(ct);
        }
        finally
        {
            active=false;
            timer.Stop();
            player.Pause();
            state(AvatarActivityState.Idle);
        }
    }

    private static (float[] Data,int Rate) ReadPcm16(byte[] wav)
    {
        int channels=0, rate=0, bits=0, format=0, dataStart=0, dataSize=0;
        for (int p=12;p+8<=wav.Length;)
        {
            var length=BitConverter.ToInt32(wav,p+4);
            if(length<0 || length>wav.Length-p-8) break;
            if(wav.AsSpan(p,4).SequenceEqual("fmt "u8) && length>=16)
            { format=BitConverter.ToUInt16(wav,p+8); channels=BitConverter.ToUInt16(wav,p+10);
              rate=BitConverter.ToInt32(wav,p+12); bits=BitConverter.ToUInt16(wav,p+22); }
            if(wav.AsSpan(p,4).SequenceEqual("data"u8)) { dataStart=p+8; dataSize=length; }
            p+=8+length+(length&1);
        }
        if(format!=1 || bits!=16 || channels<1 || channels>8 || rate<8000 || rate>192000 || dataSize==0)
            return (Array.Empty<float>(),0);
        var data=new float[dataSize/(channels*2)];
        for(int i=0;i<data.Length;i++)
        {
            double sum=0;
            for(int c=0;c<channels;c++) sum+=BitConverter.ToInt16(wav,dataStart+(i*channels+c)*2)/32768.0;
            data[i]=(float)(sum/channels);
        }
        return (data,rate);
    }
}
