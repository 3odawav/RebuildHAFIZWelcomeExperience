using System.Net;
using System.Text;
using HAFIZ.Infrastructure.Providers;
using Xunit;

namespace HAFIZ.Tests;

public sealed class LocalAiClientTests
{
    [Theory]
    [InlineData("https://example.org")]
    [InlineData("http://192.168.1.20:8080")]
    [InlineData("http://user@127.0.0.1:8080")]
    public void RejectsNonLocalEndpoints(string url) =>
        Assert.Throws<InvalidOperationException>(()=>LocalAiClient.Endpoint(url,"models"));

    [Fact]
    public async Task ChatUsesRealReturnedTextAndLocalModelId()
    {
        using var client=new LocalAiClient(new FakeHandler());
        var text=await client.ChatAsync("http://127.0.0.1:8080","","Egyptian","hello",CancellationToken.None);
        Assert.Equal("أهلاً",text);
    }
    private sealed class FakeHandler:HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage req,CancellationToken ct)
        {
            Assert.True(req.RequestUri!.IsLoopback);
            if(req.RequestUri.AbsolutePath=="/v1/models") return Reply("{\"data\":[{\"id\":\"local-test\"}]}");
            Assert.Equal("/v1/chat/completions",req.RequestUri.AbsolutePath);
            Assert.Contains("local-test",await req.Content!.ReadAsStringAsync(ct));
            return Reply("{\"choices\":[{\"message\":{\"content\":\"أهلاً\"}}]}");
        }
        private static HttpResponseMessage Reply(string json)=>new(HttpStatusCode.OK){Content=new StringContent(json,Encoding.UTF8,"application/json")};
    }
}
