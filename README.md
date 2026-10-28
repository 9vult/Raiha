# Raiha Discord Accessibility Bot

Raiha is a simple, easy-to use bot whose core focus is making alt text easier to write and use.

## Setup

### For Deployment

TODO

### For Development

Create a .NET User Secrets JSON file for `Raiha.Host` with your Discord bot token, the ID of the guild you want to
deploy commands for testing to, and your Discord account ID:

```json
{
  "Discord": {
    "Token": "",
    "GuildId": 123456,
    "OwnerId": 123456
  }
}
```

---

© 2022–2026 9volt.