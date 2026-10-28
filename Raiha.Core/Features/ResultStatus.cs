// SPDX-License-Identifier: MPL-2.0

namespace Raiha.Core.Features;

public enum ResultStatus
{
    /// <summary>
    /// Task completed successfully
    /// </summary>
    Success,

    /// <summary>
    /// Generic error condition
    /// </summary>
    Error,

    /// <summary>
    /// User is not authorized to perform an action
    /// </summary>
    Unauthorized,

    /// <summary>
    /// User provided invalid inputs
    /// </summary>
    BadRequest,
}
