# Connecting to WebSocket Servers

Learn how to establish and manage WebSocket connections for real-time communication.

---

## What are WebSockets?

**WebSockets** provide full-duplex communication between client and server over a single TCP connection. Unlike HTTP:

- **Persistent Connection** - Stays open for continuous communication
- **Real-time** - Instant bidirectional messaging
- **Low Latency** - No request/response overhead
- **Event-Driven** - Server can push messages anytime

### WebSocket vs HTTP

| Aspect | HTTP | WebSocket |
|--------|------|-----------|
| **Connection** | Request/response | Persistent |
| **Direction** | Client → Server | Bidirectional |
| **Overhead** | Headers on every request | Initial handshake only |
| **Use Case** | API calls, page loads | Real-time updates, chat |
| **Protocol** | `http://` / `https://` | `ws://` / `wss://` |

---

## When to Use WebSockets

### ✅ Good Use Cases

1. **Chat Applications** - Real-time messaging
2. **Live Updates** - Stock tickers, sports scores
3. **Collaborative Editing** - Google Docs-style
4. **Gaming** - Multiplayer games
5. **IoT** - Sensor data streaming
6. **Notifications** - Push notifications
7. **Live Dashboards** - Monitoring systems

### ❌ When to Use HTTP Instead

1. **Simple API Calls** - One-time data fetch
2. **File Uploads** - Better with HTTP
3. **RESTful CRUD** - Standard operations
4. **Caching Needed** - HTTP caching is mature
5. **Stateless Operations** - No need for persistent connection

---

## WebSocket URL Format

### Basic Format

```
ws://hostname:port/path
wss://hostname:port/path
```

**Components:**
- `ws://` - Unencrypted WebSocket
- `wss://` - Encrypted WebSocket (recommended)
- `hostname` - Server address
- `port` - Port number (80 for ws, 443 for wss)
- `path` - Endpoint path

### Examples

```
ws://localhost:3000/chat
wss://echo.websocket.org
wss://api.example.com/realtime
ws://192.168.1.100:8080/updates
```

---

## Connecting in Simba

### Step 1: Create WebSocket Request

1. Click **"New Request"**
2. Select **"WebSocket"** type
3. Enter WebSocket URL:
   ```
   wss://echo.websocket.org
   ```
4. Click **"Connect"**

### Connection States

| State | Description | Color |
|-------|-------------|-------|
| **Disconnected** | Not connected | Gray |
| **Connecting** | Establishing connection | Yellow |
| **Connected** | Active connection | Green |
| **Closing** | Gracefully closing | Orange |
| **Error** | Connection failed | Red |

### Connection Panel

Once connected, you'll see:
- **Connection Status** - Current state
- **Duration** - How long connected
- **Messages Sent** - Count of sent messages
- **Messages Received** - Count of received messages
- **Disconnect Button** - Close connection

---

## Connection Parameters

### Query Parameters

Add query parameters to URL:

```
wss://api.example.com/realtime?token=abc123&room=lobby
```

### Headers

Add custom headers during handshake:

```
Authorization: Bearer {{token}}
User-Agent: Simba API Testing Tool
X-Client-ID: {{clientId}}
```

**Note:** Some headers may be restricted by browsers.

### Protocols (Subprotocols)

Specify WebSocket subprotocols:

```javascript
// In connection settings
protocols: ['mqtt', 'soap']
```

Common subprotocols:
- `mqtt` - MQTT over WebSocket
- `stomp` - STOMP messaging protocol
- `soap` - SOAP over WebSocket
- Custom protocols

---

## Real-World Connection Examples

### Example 1: Echo Server (Testing)

**URL:**
```
wss://echo.websocket.org
```

**Description:** Echoes back any message you send. Perfect for testing.

**Connect:**
1. Enter URL
2. Click Connect
3. Send: `Hello`
4. Receive: `Hello`

### Example 2: Binance Crypto Stream

**URL:**
```
wss://stream.binance.com:9443/ws/btcusdt@trade
```

**Description:** Real-time Bitcoin trades.

**Connect:**
1. Enter URL
2. Click Connect
3. Receive trade updates automatically

**Example Message:**
```json
{
  "e": "trade",
  "E": 1637612345678,
  "s": "BTCUSDT",
  "t": 12345,
  "p": "50000.00",
  "q": "0.001",
  "T": 1637612345678
}
```

### Example 3: Finnhub Stock Updates

**URL:**
```
wss://ws.finnhub.io?token={{apiKey}}
```

**Subscribe to stock:**
```json
{
  "type": "subscribe",
  "symbol": "AAPL"
}
```

### Example 4: Slack Real-Time API

**URL (from authentication):**
```
wss://wss-primary.slack.com/?token={{slackToken}}
```

**Requires OAuth token** from Slack API.

---

## Connection with Authentication

### Token in URL

```
wss://api.example.com/realtime?token={{apiToken}}
```

### Bearer Token in Header

```
Authorization: Bearer {{apiToken}}
```

### Custom Authentication

```javascript
// Pre-connection script
const token = pm.variables.get('accessToken');
pm.variables.set('wsAuthToken', token);
```

**URL:**
```
wss://api.example.com/ws?auth={{wsAuthToken}}
```

---

## Connection Scripts

### Pre-Connection Script

Run code before connecting:

```javascript
// Generate connection ID
const connectionId = `conn-${Date.now()}`;
pm.variables.set('connectionId', connectionId);

// Set headers
pm.request.headers.add({
  key: 'X-Connection-ID',
  value: connectionId
});

// Log connection attempt
console.log('Connecting to WebSocket...');
console.log('URL:', pm.request.url);
```

### On Connect Script

Run code when connection opens:

```javascript
// Log success
console.log('WebSocket connected!');
console.log('Protocol:', pm.websocket.protocol);

// Send initial message
const initialMessage = {
  type: 'authenticate',
  token: pm.variables.get('apiToken')
};
pm.websocket.send(JSON.stringify(initialMessage));

// Start heartbeat
pm.variables.set('heartbeatInterval', setInterval(() => {
  pm.websocket.send(JSON.stringify({ type: 'ping' }));
}, 30000));

// Save connection time
pm.environment.set('lastConnected', new Date().toISOString());
```

### On Disconnect Script

Run code when connection closes:

```javascript
// Clean up
const interval = pm.variables.get('heartbeatInterval');
if (interval) {
  clearInterval(interval);
  pm.variables.unset('heartbeatInterval');
}

// Log disconnection
console.log('WebSocket disconnected');
console.log('Code:', pm.websocket.closeCode);
console.log('Reason:', pm.websocket.closeReason);

// Save stats
const duration = Date.now() - new Date(pm.environment.get('lastConnected'));
console.log(`Connection lasted: ${duration}ms`);
```

---

## Handling Connection Events

### Connection Success

```javascript
pm.test("Connected successfully", () => {
  pm.expect(pm.websocket.readyState).to.equal(WebSocket.OPEN);
});

// Log connection info
console.log('Connected to:', pm.websocket.url);
console.log('Protocol:', pm.websocket.protocol);
```

### Connection Failure

```javascript
// On error
if (pm.websocket.readyState === WebSocket.CLOSED) {
  console.error('Connection failed');
  console.error('Error:', pm.websocket.error);
}

// Retry logic
let retryCount = 0;
const maxRetries = 3;

function reconnect() {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`Retry ${retryCount}/${maxRetries}...`);
    setTimeout(() => pm.websocket.connect(), 1000 * retryCount);
  } else {
    console.error('Max retries reached');
  }
}
```

### Close Codes

```javascript
// Handle different close codes
const closeCode = pm.websocket.closeCode;

switch (closeCode) {
  case 1000:
    console.log('Normal closure');
    break;
  case 1001:
    console.log('Endpoint going away');
    break;
  case 1006:
    console.error('Abnormal closure');
    break;
  case 1008:
    console.error('Policy violation');
    break;
  case 1009:
    console.error('Message too large');
    break;
  case 1011:
    console.error('Internal server error');
    break;
  default:
    console.log(`Closed with code: ${closeCode}`);
}
```

**Common close codes:**
- `1000` - Normal closure
- `1001` - Going away (page closing)
- `1002` - Protocol error
- `1003` - Unsupported data
- `1006` - Abnormal closure (no close frame)
- `1007` - Invalid data
- `1008` - Policy violation
- `1009` - Message too big
- `1010` - Extension required
- `1011` - Internal server error

---

## Connection Monitoring

### Track Connection Duration

```javascript
// On connect
const startTime = Date.now();
pm.variables.set('connectionStart', startTime);

// On disconnect
const duration = Date.now() - pm.variables.get('connectionStart');
console.log(`Connection duration: ${duration}ms`);

pm.test("Connection lasted at least 1 second", () => {
  pm.expect(duration).to.be.above(1000);
});
```

### Track Message Throughput

```javascript
// Initialize counters
pm.variables.set('messagesSent', 0);
pm.variables.set('messagesReceived', 0);

// On message sent
const sent = pm.variables.get('messagesSent') + 1;
pm.variables.set('messagesSent', sent);

// On message received
const received = pm.variables.get('messagesReceived') + 1;
pm.variables.set('messagesReceived', received);

// Display stats
console.log(`Sent: ${sent}, Received: ${received}`);
```

### Connection Health Check

```javascript
// Ping/Pong pattern
function healthCheck() {
  if (pm.websocket.readyState === WebSocket.OPEN) {
    pm.websocket.send(JSON.stringify({ type: 'ping' }));
    console.log('Health check sent');
  } else {
    console.warn('Connection not open');
    reconnect();
  }
}

// Run every 30 seconds
const healthInterval = setInterval(healthCheck, 30000);
pm.variables.set('healthInterval', healthInterval);
```

---

## Using Simba Variables

### Connection URL with Variables

```
wss://{{baseUrl}}/realtime?room={{roomId}}&user={{userId}}
```

**Environment variables:**
```json
{
  "baseUrl": "api.example.com",
  "roomId": "lobby",
  "userId": "user123"
}
```

### Dynamic Headers

```javascript
// Pre-connection
const token = pm.variables.get('authToken');
const timestamp = Date.now();

pm.request.headers.upsert({
  key: 'Authorization',
  value: `Bearer ${token}`
});

pm.request.headers.upsert({
  key: 'X-Timestamp',
  value: timestamp.toString()
});
```

---

## Connection Patterns

### Pattern 1: Auto-Reconnect

```javascript
let reconnectAttempts = 0;
const maxAttempts = 5;
const reconnectDelay = 1000; // 1 second

function attemptReconnect() {
  if (reconnectAttempts >= maxAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }
  
  reconnectAttempts++;
  console.log(`Reconnect attempt ${reconnectAttempts}/${maxAttempts}`);
  
  setTimeout(() => {
    pm.websocket.connect();
  }, reconnectDelay * reconnectAttempts); // Exponential backoff
}

// On close
if (pm.websocket.closeCode !== 1000) {
  // Not normal closure
  attemptReconnect();
}

// On connect success
reconnectAttempts = 0; // Reset counter
```

### Pattern 2: Connection Pool

```javascript
// Manage multiple connections
const connections = {
  chat: 'wss://chat.example.com',
  notifications: 'wss://notify.example.com',
  updates: 'wss://updates.example.com'
};

// Store connection states
const states = {};

Object.entries(connections).forEach(([name, url]) => {
  // Connect to each
  states[name] = {
    url: url,
    connected: false,
    retries: 0
  };
});
```

### Pattern 3: Heartbeat

```javascript
// Keep connection alive
function startHeartbeat() {
  const interval = setInterval(() => {
    if (pm.websocket.readyState === WebSocket.OPEN) {
      pm.websocket.send(JSON.stringify({ 
        type: 'heartbeat',
        timestamp: Date.now()
      }));
    } else {
      stopHeartbeat();
    }
  }, 30000); // Every 30 seconds
  
  pm.variables.set('heartbeatInterval', interval);
}

function stopHeartbeat() {
  const interval = pm.variables.get('heartbeatInterval');
  if (interval) {
    clearInterval(interval);
    pm.variables.unset('heartbeatInterval');
  }
}

// On connect
startHeartbeat();

// On disconnect
stopHeartbeat();
```

---

## Troubleshooting

### Issue: Connection Refused

**Error:** `WebSocket connection failed`

**Causes:**
1. Wrong URL/port
2. Server not running
3. Firewall blocking connection
4. SSL certificate issues (wss)

**Solutions:**
- Verify URL is correct
- Check server is running
- Try `ws://` instead of `wss://` (development only)
- Check firewall settings
- Verify SSL certificate is valid

### Issue: Connection Closes Immediately

**Error:** Connection opens then closes

**Causes:**
1. Authentication required
2. Missing required headers
3. Server rejecting connection
4. Protocol mismatch

**Solutions:**
- Add authentication token
- Check required headers
- Verify server logs
- Check subprotocol requirements

### Issue: Handshake Failed

**Error:** `Invalid handshake response`

**Causes:**
1. Server not supporting WebSocket
2. Proxy interference
3. Wrong protocol
4. CORS issues

**Solutions:**
- Verify server supports WebSocket
- Try direct connection (bypass proxy)
- Check WebSocket protocol version
- Add CORS headers if needed

### Issue: Timeout

**Error:** Connection times out

**Causes:**
1. Server not responding
2. Network issues
3. Slow connection
4. Firewall timeout

**Solutions:**
- Increase timeout setting
- Check network connection
- Try different network
- Implement retry logic

---

## Security Best Practices

### 1. Always Use WSS in Production

❌ **Bad:**
```
ws://api.example.com/realtime
```

✅ **Good:**
```
wss://api.example.com/realtime
```

### 2. Validate Server Certificate

```javascript
// In production, ensure valid SSL
if (!pm.websocket.url.startsWith('wss://')) {
  throw new Error('Insecure WebSocket connection!');
}
```

### 3. Authenticate Connections

```javascript
// Send auth immediately after connecting
pm.websocket.send(JSON.stringify({
  type: 'auth',
  token: pm.variables.get('authToken')
}));
```

### 4. Implement Timeouts

```javascript
// Close if inactive
const timeout = setTimeout(() => {
  if (pm.websocket.readyState === WebSocket.OPEN) {
    console.log('Closing inactive connection');
    pm.websocket.close(1000, 'Inactive timeout');
  }
}, 300000); // 5 minutes

pm.variables.set('inactivityTimeout', timeout);
```

### 5. Sanitize Received Data

```javascript
// Validate incoming messages
try {
  const message = JSON.parse(data);
  
  // Validate structure
  if (!message.type) {
    throw new Error('Invalid message format');
  }
  
  // Process message
  handleMessage(message);
} catch (error) {
  console.error('Invalid message:', error);
}
```

---

## Connection Testing

### Test Suite Example

```javascript
pm.test("WebSocket connects successfully", () => {
  pm.expect(pm.websocket.readyState).to.equal(WebSocket.OPEN);
});

pm.test("Connection uses secure protocol", () => {
  pm.expect(pm.websocket.url).to.match(/^wss:\/\//);
});

pm.test("Connection has valid protocol", () => {
  const protocol = pm.websocket.protocol;
  if (protocol) {
    pm.expect(protocol).to.be.a('string');
  }
});

pm.test("Headers sent correctly", () => {
  const auth = pm.request.headers.get('Authorization');
  pm.expect(auth).to.exist;
  pm.expect(auth).to.include('Bearer');
});
```

---

## Next Steps

- **[Sending & Receiving Messages](messages.md)** - Communicate over WebSocket
- **[Test Scripts](../../advanced/test-scripts.md)** - Test WebSocket connections
- **[Variables](../../concepts/variables.md)** - Use variables in WebSocket URLs
- **[Authentication](../../authentication/bearer-token.md)** - Authenticate WebSocket connections

## Related Topics

- [Request Types](../rest/overview.md)
- [Real-time Testing](../../advanced/websocket-testing.md)
- [Collection Runner](../../advanced/collection-runner.md)
