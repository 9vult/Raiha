// SPDX-License-Identifier: MPL-2.0

using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Raiha.Discord.Handlers;

namespace Raiha.Discord;

public sealed class DiscordBotHostedService(
    DiscordSocketClient client,
    InteractionHandler interactionHandler,
    MessageReceivedHandler messageReceivedHandler,
    IOptions<DiscordOptions> options,
    ILogger<DiscordBotHostedService> logger
) : IHostedService
{
    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting Raiha Discord Bot...");
        client.Ready += OnReady;
        client.Log += OnLog;

        await interactionHandler.InitializeAsync();
        await messageReceivedHandler.InitializeAsync();

        await client.LoginAsync(TokenType.Bot, options.Value.Token);
        await client.StartAsync();
    }

    /// <inheritdoc />
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Stopping Raiha Discord Bot...");

        await client.LogoutAsync();
        await client.StopAsync();
    }

    private Task OnLog(LogMessage message)
    {
        if (string.IsNullOrEmpty(message.Message) || message.Exception is GatewayReconnectException)
            return Task.CompletedTask;

        logger.Log(
            logLevel: message.Severity switch
            {
                LogSeverity.Info
                    when message.Message
                        is "Disconnecting"
                            or "Disconnected"
                            or "Connecting"
                            or "Connected"
                            or "Resumed previous session" => LogLevel.Trace,
                LogSeverity.Critical => LogLevel.Critical,
                LogSeverity.Error => LogLevel.Error,
                LogSeverity.Warning => LogLevel.Warning,
                LogSeverity.Info => LogLevel.Information,
                LogSeverity.Verbose => LogLevel.Debug,
                LogSeverity.Debug => LogLevel.Trace,
                _ => LogLevel.Information,
            },
            exception: message.Exception,
            message: "{DiscordMessage}",
            args: message.Message
        );
        return Task.CompletedTask;
    }

    private Task OnReady()
    {
        logger.LogInformation(
            "Successfully logged in to Discord as {Username}",
            client.CurrentUser.Username
        );
        return Task.CompletedTask;
    }
}
