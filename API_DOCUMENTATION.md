# Minecraft Elo Ranking System - API Documentation

## Base URL
```
https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1
```

## Authentication
The API endpoints use different authentication methods:
- **Public endpoints** (GET): Use the anon key
- **Update endpoints** (POST): Use the service role key (keep secret in your plugin!)

## Endpoints

### 1. Update Player Stats
Update or create a player's stats in the leaderboard.

**Endpoint:** `POST /update-player`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

**Request Body:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "PlayerName",
  "elo": 1523,
  "kills": 45,
  "deaths": 32,
  "highest_elo": 1600,
  "current_streak": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "PlayerName",
    "elo": 1523,
    "kills": 45,
    "deaths": 32,
    "kd_ratio": 1.41,
    "highest_elo": 1600,
    "current_streak": 3,
    "last_active": "2025-01-01T12:00:00Z",
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1/update-player \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "PlayerName",
    "elo": 1523,
    "kills": 45,
    "deaths": 32,
    "highest_elo": 1600,
    "current_streak": 3
  }'
```

---

### 2. Get Leaderboard
Retrieve the current leaderboard rankings.

**Endpoint:** `GET /get-leaderboard?limit=100`

**Headers:**
```
Authorization: Bearer YOUR_ANON_KEY (optional for public access)
```

**Query Parameters:**
- `limit` (optional): Number of players to return (default: 100)

**Response:**
```json
{
  "players": [
    {
      "rank": 1,
      "id": "...",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "username": "TopPlayer",
      "elo": 2500,
      "kills": 500,
      "deaths": 100,
      "kd_ratio": 5.00,
      "highest_elo": 2600,
      "current_streak": 15,
      "last_active": "2025-01-01T12:00:00Z",
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-01T12:00:00Z"
    },
    ...
  ],
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**Example cURL:**
```bash
curl https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1/get-leaderboard?limit=50
```

---

## Plugin Integration Guide

### 1. Configuration
Add these to your plugin's `config.yml`:

```yaml
api:
  base-url: "https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1"
  service-key: "YOUR_SERVICE_ROLE_KEY_HERE"  # Keep this secret!
  anon-key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Public key
  update-interval: 5  # seconds
```

### 2. Update Player on Kill/Death
When a player kills another player, update both players' stats:

```java
// Pseudo-code example
public void onPlayerKill(Player killer, Player victim) {
    // Calculate new Elo ratings
    int killerNewElo = calculateElo(killer.getElo(), victim.getElo(), true);
    int victimNewElo = calculateElo(victim.getElo(), killer.getElo(), false);
    
    // Update killer
    updatePlayerAPI(killer.getUUID(), killer.getName(), killerNewElo, 
                   killer.getKills() + 1, killer.getDeaths(),
                   Math.max(killer.getHighestElo(), killerNewElo),
                   killer.getStreak() + 1);
    
    // Update victim
    updatePlayerAPI(victim.getUUID(), victim.getName(), victimNewElo,
                   victim.getKills(), victim.getDeaths() + 1,
                   victim.getHighestElo(),
                   victim.getStreak() < 0 ? victim.getStreak() - 1 : -1);
}
```

### 3. HTTP Request Example (Java)
```java
import java.net.http.*;
import com.google.gson.Gson;

public void updatePlayerAPI(UUID uuid, String username, int elo, int kills, 
                           int deaths, int highestElo, int streak) {
    String url = config.getString("api.base-url") + "/update-player";
    String serviceKey = config.getString("api.service-key");
    
    // Create JSON body
    Map<String, Object> body = new HashMap<>();
    body.put("uuid", uuid.toString());
    body.put("username", username);
    body.put("elo", elo);
    body.put("kills", kills);
    body.put("deaths", deaths);
    body.put("highest_elo", highestElo);
    body.put("current_streak", streak);
    
    String jsonBody = new Gson().toJson(body);
    
    // Send async HTTP request
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + serviceKey)
        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
        .build();
    
    client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
        .thenApply(HttpResponse::body)
        .thenAccept(response -> {
            getLogger().info("Player updated: " + response);
        })
        .exceptionally(e -> {
            getLogger().warning("Failed to update player: " + e.getMessage());
            return null;
        });
}
```

### 4. Batch Updates (Recommended)
Instead of updating immediately on each kill, queue updates and send them in batches every 5 seconds:

```java
private Queue<PlayerUpdate> updateQueue = new ConcurrentLinkedQueue<>();

// Add to queue
public void queuePlayerUpdate(PlayerUpdate update) {
    updateQueue.offer(update);
}

// Send batch every 5 seconds
public void sendBatchUpdates() {
    if (updateQueue.isEmpty()) return;
    
    List<PlayerUpdate> batch = new ArrayList<>();
    while (!updateQueue.isEmpty() && batch.size() < 50) {
        batch.add(updateQueue.poll());
    }
    
    // Send each update asynchronously
    for (PlayerUpdate update : batch) {
        updatePlayerAPI(update);
    }
}
```

---

## Security Notes

### Service Role Key
⚠️ **CRITICAL:** Never expose your service role key publicly!
- Store it in `config.yml` (not in source code)
- Add `config.yml` to `.gitignore`
- Only use it server-side (in your plugin)
- Never send it to the website or client

### Anon Key
✅ Safe to use publicly:
- Can be used in the website
- Only allows read access to public data
- Cannot modify player stats

---

## Rate Limiting
- No hard rate limits currently
- Recommended: Batch updates every 5 seconds
- Avoid sending 100+ requests per second

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "success": false,
  "error": "Missing required field: uuid"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

### Recommended Retry Logic
```java
int maxRetries = 3;
int retryCount = 0;

while (retryCount < maxRetries) {
    try {
        updatePlayerAPI(data);
        break; // Success
    } catch (Exception e) {
        retryCount++;
        Thread.sleep(1000 * retryCount); // Exponential backoff
    }
}
```

---

## Testing

### Test the API with sample data
```bash
# Update a test player
curl -X POST https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1/update-player \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "uuid": "test-uuid-123",
    "username": "TestPlayer",
    "elo": 1200,
    "kills": 10,
    "deaths": 5,
    "highest_elo": 1200,
    "current_streak": 2
  }'

# Get leaderboard
curl https://pelxmtqzidxoxzwccbsn.supabase.co/functions/v1/get-leaderboard?limit=10
```

---

## Support

For issues or questions:
1. Check the plugin logs for API errors
2. Verify your service key is correct
3. Test endpoints with cURL first
4. Check network connectivity from server

## Changelog

**v1.0.0** (2025-01-01)
- Initial API release
- `/update-player` endpoint
- `/get-leaderboard` endpoint
- Real-time updates via Supabase Realtime
