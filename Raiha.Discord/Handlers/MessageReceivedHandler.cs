// SPDX-License-Identifier: MPL-2.0

using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;

namespace Raiha.Discord.Handlers;

public sealed class MessageReceivedHandler(
    DiscordSocketClient client,
    IServiceScopeFactory scopeFactory
)
{
    public Task InitializeAsync()
    {
        client.MessageReceived += OnMessageReceivedAsync;
        return Task.CompletedTask;
    }

    private async Task OnMessageReceivedAsync(SocketMessage arg)
    {
        throw new NotImplementedException();
    }
}
