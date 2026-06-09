namespace SkyRoute.Server.Core.Exceptions;

public sealed class NotFoundException(string message) : Exception(message);
