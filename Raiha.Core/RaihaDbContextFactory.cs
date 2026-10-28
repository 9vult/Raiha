// SPDX-License-Identifier: MPL-2.0

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Raiha.Core;

/// <summary>
/// Design-time DbContext factory for EF Core to use when creating migrations
/// </summary>
public class RaihaDbContextFactory : IDesignTimeDbContextFactory<RaihaDbContext>
{
    public RaihaDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<RaihaDbContext>()
            .UseSqlite(
                "Data Source=:memory:",
                sqlite => sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery)
            )
            .Options;

        return new RaihaDbContext(options);
    }
}
