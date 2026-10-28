// SPDX-License-Identifier: MPL-2.0

using Microsoft.EntityFrameworkCore;

namespace Raiha.Core;

public sealed class ReadOnlyRaihaDbContext : RaihaDbContext
{
    public ReadOnlyRaihaDbContext(DbContextOptions<RaihaDbContext> options)
        : base(options)
    {
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
        ChangeTracker.AutoDetectChangesEnabled = false;
    }
}
