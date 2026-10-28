// SPDX-License-Identifier: MPL-2.0

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Raiha.Core.Events;
using Raiha.Core.Features.Commands;
using Raiha.Core.Features.Queries;
using Raiha.Core.Services;

namespace Raiha.Core;

public static class CoreServiceCollectionExtensions
{
    public static IServiceCollection AddCore(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddHttpClient();

        // Database
        services.AddDbContext<RaihaDbContext>(ConfigureDb);
        services.AddDbContext<ReadOnlyRaihaDbContext>(ConfigureDb);

        // Add command, query handlers
        var handlers = typeof(CoreServiceCollectionExtensions)
            .Assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false })
            .Where(t =>
                t.GetInterfaces()
                    .Any(i =>
                        i.IsGenericType
                        && (
                            i.GetGenericTypeDefinition() == typeof(ICommandHandler<,>)
                            || i.GetGenericTypeDefinition() == typeof(IQueryHandler<,>)
                        )
                    )
            )
            .ToList();
        foreach (var handler in handlers)
            services.AddScoped(handler);

        // Events
        services.AddScoped<IEventBus, InMemoryEventBus>();

        // Services
        services.AddScoped<VersionService>();

        // EventHandlers

        return services;

        void ConfigureDb(DbContextOptionsBuilder options) =>
            options.UseSqlite(
                configuration.GetConnectionString("Raiha"),
                sqlite => sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery)
            );
    }
}
