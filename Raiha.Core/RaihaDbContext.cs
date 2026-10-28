// SPDX-License-Identifier: MPL-2.0

using System.Globalization;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Raiha.Domain.ValueObjects;
using Vogen;

namespace Raiha.Core;

public class RaihaDbContext(DbContextOptions<RaihaDbContext> options) : DbContext(options)
{
    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(RaihaDbContext).Assembly);
    }

    /// <inheritdoc />
    protected override void ConfigureConventions(ModelConfigurationBuilder builder)
    {
        base.ConfigureConventions(builder);

        // Vogen
        var voTypes = typeof(UserId)
            .Assembly.GetTypes()
            .Where(t => t.IsValueType && t.GetCustomAttribute<ValueObjectAttribute>() is not null);

        foreach (var type in voTypes)
        {
            var converterType = type.GetNestedType("EfCoreValueConverter");
            if (converterType is not null)
                builder.Properties(type).HaveConversion(converterType);
        }

        // Other converters
        builder.Properties<ulong>().HaveConversion<UlongStringConverter>();
    }

    private class UlongStringConverter()
        : ValueConverter<ulong, string>(
            v => v.ToString(CultureInfo.InvariantCulture),
            v => ulong.Parse(v, CultureInfo.InvariantCulture)
        );
}
