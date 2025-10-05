# Minecraft Elo Ranking System Plugin Design

## Overview
An Elo-based competitive ranking system for Minecraft 1.21.8 anarchy servers. The system rewards skilled PvP combat and creates a dynamic leaderboard where killing higher-ranked players yields greater rewards.

## Core Elo System Mechanics

### Base Configuration
- **Starting Elo**: 1000 (default for new players)
- **K-Factor**: Dynamic based on Elo difference
- **Elo Range**: 0 - ∞ (no upper limit)

### Point Calculation Formula

The system uses a modified Elo formula similar to chess.com:

```
Expected Score (E) = 1 / (1 + 10^((OpponentElo - PlayerElo) / 400))
K-Factor = Base K-Factor * Elo Modifier
Points Gained/Lost = K-Factor * (Actual Score - Expected Score)
```

#### Dynamic K-Factor System
- **Low Elo (0-1200)**: K = 40 (faster progression for new players)
- **Mid Elo (1201-2000)**: K = 32 (standard progression)
- **High Elo (2001-2800)**: K = 24 (slower gains/losses)
- **Elite Elo (2801+)**: K = 16 (minimal changes, hard to maintain)

### Example Scenarios

#### Scenario 1: Equal Skill Match
- **Player A Elo**: 1500
- **Player B Elo**: 1500
- **Expected Win Chance**: 50%
- **A kills B**: A gains ~16 points, B loses ~16 points

#### Scenario 2: Underdog Victory
- **Player A Elo**: 1200 (killer)
- **Player B Elo**: 1800 (victim)
- **Expected Win Chance for A**: ~15%
- **A kills B**: A gains ~34 points, B loses ~34 points

#### Scenario 3: Expected Victory
- **Player A Elo**: 2000 (killer)
- **Player B Elo**: 1000 (victim)
- **Expected Win Chance for A**: ~99%
- **A kills B**: A gains ~1 point, B loses ~1 point

## Plugin Features

### 1. Kill/Death Tracking
- Real-time Elo calculation on player death
- Track kill/death ratio
- Track total kills and deaths
- Track current win/loss streak

### 2. Player Stats
```
- UUID (unique identifier)
- Username
- Current Elo
- Total Kills
- Total Deaths
- K/D Ratio
- Highest Elo Achieved
- Current Streak
- Join Date
- Last Active
```

### 3. Events Tracked
- `PlayerDeathEvent` - Main event for Elo calculation
  - Verify PvP death (player killed by player)
  - Calculate Elo change
  - Update both killer and victim stats
  - Broadcast Elo changes to server
  - Send API update to website

### 4. Commands

#### Player Commands
- `/elo` - View your current Elo and stats
- `/elo <player>` - View another player's stats
- `/leaderboard` - View top 10 players
- `/rank` - View your current rank position

#### Admin Commands
- `/elo set <player> <amount>` - Set player Elo
- `/elo reset <player>` - Reset player to 1000 Elo
- `/elo reload` - Reload plugin configuration

### 5. Configuration (config.yml)
```yaml
# Elo System Settings
starting-elo: 1000
minimum-elo: 0

# K-Factor Brackets
k-factors:
  low: 40      # 0-1200
  mid: 32      # 1201-2000
  high: 24     # 2001-2800
  elite: 16    # 2801+

# API Settings
api:
  enabled: true
  endpoint: "https://your-website.com/api"
  update-interval: 5 # seconds between batch updates

# Display Settings
broadcasts:
  kill-message: true
  elo-change: true
  rank-up: true
  rank-down: true

# Anti-Abuse
minimum-distance: 5 # blocks (prevent suicide farming)
cooldown: 30 # seconds between same-player kills counting
```

### 6. Database Storage
Local SQLite database storing:
- Player UUID
- Current stats
- Historical Elo changes (last 100 matches)
- Timestamp tracking

## API Integration

### Endpoints to Implement

#### 1. Update Player Stats (POST)
```json
POST /api/players/update
{
  "uuid": "player-uuid",
  "username": "PlayerName",
  "elo": 1523,
  "kills": 45,
  "deaths": 32,
  "kd_ratio": 1.41,
  "highest_elo": 1600,
  "current_streak": 3
}
```

#### 2. Batch Update (POST)
```json
POST /api/players/batch
{
  "players": [
    {
      "uuid": "uuid1",
      "username": "Player1",
      "elo": 1500,
      ...
    },
    {
      "uuid": "uuid2",
      "username": "Player2",
      "elo": 1450,
      ...
    }
  ]
}
```

#### 3. Get Leaderboard (GET)
```json
GET /api/leaderboard?limit=100

Response:
{
  "players": [
    {
      "rank": 1,
      "username": "TopPlayer",
      "elo": 2500,
      "kills": 500,
      "deaths": 100
    },
    ...
  ],
  "updated_at": "2025-01-01T12:00:00Z"
}
```

#### 4. Get Player Stats (GET)
```json
GET /api/players/{uuid}

Response:
{
  "uuid": "player-uuid",
  "username": "PlayerName",
  "elo": 1523,
  "rank": 42,
  "kills": 45,
  "deaths": 32,
  "kd_ratio": 1.41,
  "recent_matches": [...]
}
```

## Anti-Abuse Measures

### 1. Kill Farming Prevention
- Minimum distance check (5 blocks default)
- Same-player kill cooldown (30 seconds)
- Suspicious pattern detection (same 2 players trading kills)

### 2. Alt Account Protection
- Track IP addresses (optional)
- Flag accounts with similar login patterns
- Admin review system for suspicious accounts

### 3. AFK Kill Prevention
- Require victim to have moved in last 30 seconds
- Require victim to have dealt damage in last 60 seconds

## Ranking Tiers (Optional Display)

- **Unranked**: 0-999
- **Bronze**: 1000-1199
- **Silver**: 1200-1399
- **Gold**: 1400-1599
- **Platinum**: 1600-1799
- **Diamond**: 1800-1999
- **Master**: 2000-2199
- **Grandmaster**: 2200-2499
- **Legend**: 2500+

## Technical Implementation Notes

### Dependencies
- Spigot/Paper API 1.21.8
- SQLite JDBC driver
- JSON library (Gson)
- HTTP client (OkHttp)

### Performance Considerations
- Async database operations
- Batch API updates every 5 seconds
- Cache top 100 leaderboard
- Use indexes on UUID and Elo columns

### Testing Checklist
- [ ] Elo calculation accuracy
- [ ] API connection handling
- [ ] Database performance with 1000+ players
- [ ] Anti-abuse measures effectiveness
- [ ] Plugin reload without data loss
- [ ] Compatibility with other plugins

## Future Enhancements
1. Season system with Elo decay
2. Historical Elo graphs
3. Achievement system
4. Combat statistics (weapon preferences, average fight duration)
5. Discord integration for notifications
6. Bounty system for high-Elo players
