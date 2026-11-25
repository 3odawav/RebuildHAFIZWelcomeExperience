using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Shapes;
using Windows.UI;

namespace HAFIZ.App.Controls;

public sealed partial class MatrixField : UserControl
{
    private readonly DispatcherTimer _timer = new() { Interval=TimeSpan.FromMilliseconds(50) };
    private readonly List<TextBlock> _glyphs = new();
    private readonly List<Ellipse> _nodes = new();
    private readonly List<Line> _links = new();
    private readonly Random _random = new(1977);
    private bool _requested;
    private double _phase;

    public MatrixField()
    {
        InitializeComponent();
        var blue = new SolidColorBrush(Color.FromArgb(255,0,183,255));
        for(int i=0;i<36;i++)
        {
            var text = new TextBlock { Text=i%3==0?"01\n10\n11\n00":"1\n0\n1\n0", FontFamily=new FontFamily("Consolas"),FontSize=12,Foreground=blue,Opacity=0.16 };
            _glyphs.Add(text); Field.Children.Add(text);
        }
        for(int i=0;i<18;i++)
        {
            var node=new Ellipse { Width=4,Height=4,Fill=blue,Opacity=0.5 };
            _nodes.Add(node);Field.Children.Add(node);
            var line=new Line { Stroke=blue,StrokeThickness=0.7,Opacity=0.18 };
            _links.Add(line);Field.Children.Add(line);
        }
        _timer.Tick+=(_,_)=>Render(0.05);
        Loaded+=(_,_)=>{if(_requested)_timer.Start();Render(0);};
        Unloaded+=(_,_)=>_timer.Stop();
        SizeChanged+=(_,_)=>Render(0);
    }
    public void SetRunning(bool running)
    {
        _requested=running;
        if(running && IsLoaded)_timer.Start();else _timer.Stop();
        Render(0);
    }
    private void Render(double dt)
    {
        if(Field is null || ActualWidth<=0 || ActualHeight<=0)return;
        _phase+=dt;
        double w=ActualWidth,h=ActualHeight;
        for(int i=0;i<_glyphs.Count;i++)
        {
            double x=w*(i+0.5)/_glyphs.Count;
            double speed=12+(i%5)*4;
            double y=((i*107+_phase*speed)%(h+100))-90;
            Canvas.SetLeft(_glyphs[i],x);Canvas.SetTop(_glyphs[i],y);
            _glyphs[i].Opacity=0.10+0.18*(0.5+0.5*Math.Sin(_phase*0.9+i));
        }
        double radius=Math.Min(w,h)*0.36;
        for(int i=0;i<_nodes.Count;i++)
        {
            double a=i*Math.PI*2/_nodes.Count+_phase*0.055;
            double r=radius*(0.88+0.11*Math.Sin(i*1.7+_phase*0.7));
            double x=w/2+Math.Cos(a)*r,y=h*0.43+Math.Sin(a)*r*0.82;
            double b=a+Math.PI*2/_nodes.Count;
            Canvas.SetLeft(_nodes[i],x);Canvas.SetTop(_nodes[i],y);
            _nodes[i].Opacity=0.30+0.50*(0.5+0.5*Math.Sin(i+_phase));
            _links[i].X1=x;_links[i].Y1=y;
            _links[i].X2=w/2+Math.Cos(b)*radius*0.88;
            _links[i].Y2=h*0.43+Math.Sin(b)*radius*0.82*0.88;
        }
    }
}