# Sending & Receiving WebSocket Messages

Master WebSocket messaging for real-time bidirectional communication.

---

## Message Flow

WebSocket communication is **bidirectional**:

```
Client ←→ Server

Send: Client → Server
Receive: Server → Client
Both can initiate messages anytime
```

Unlike HTTP:
- ❌ No request/response pattern required
- ✅ Both sides can send messages independently
- ✅ Messages arrive in real-time
- ✅ No polling needed

---

## Message Types

### Text Messages

Most common - JSON or plain text:

```javascript
// Send JSON
{
  "type": "message",
  "content": "Hello, World!",
  "timestamp": 1713264000000
}

// Send plain text
"Hello, World!"
```

### Binary Messages

For images, files, or efficient data:

```javascript
// Send binary data
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view[0] = 255;

pm.websocket.send(buffer);
```

### Ping/Pong (Control Frames)

Keep connection alive:

```javascript
// Ping (automatic in most clients)
pm.websocket.ping();

// Pong response (automatic)
// Server responds automatically
```

---

## Sending Messages in Simba

### Send Text Message

1. Connect to WebSocket
2. Type message in **"Message"** field
3. Click **"Send"**

### Send JSON

```json
{
  "type": "chat",
  "message": "Hello!",
  "user": "{{username}}",
  "timestamp": "{{$timestamp}}"
}
```

**Template Variables:**
- `{{variableName}}` - Simba variable
- `{{$timestamp}}` - Current Unix timestamp
- `{{$randomInt}}` - Random integer
- `{{$guid}}` - Random GUID

### Send with Pre-Send Script

```javascript
// Generate dynamic message
const message = {
  type: 'update',
  data: {
    temperature: Math.random() * 100,
    timestamp: Date.now()
  },
  userId: pm.variables.get('userId')
};

// Set as message to send
pm.websocket.message = JSON.stringify(message);
```

### Send Multiple Messages

```javascript
// Send sequence of messages
const messages = [
  { type: 'subscribe', channel: 'updates' },
  { type: 'subscribe', channel: 'notifications' },
  { type: 'ready' }
];

messages.forEach(msg => {
  pm.websocket.send(JSON.stringify(msg));
});
```

---

## Receiving Messages

### Message Handler

```javascript
// Process incoming messages
pm.websocket.on('message', (data) => {
  console.log('Received:', data);
  
  try {
    const message = JSON.parse(data);
    
    // Handle different message types
    switch (message.type) {
      case 'welcome':
        console.log('Welcome message:', message.content);
        break;
      
      case 'update':
        console.log('Update:', message.data);
        break;
      
      case 'error':
        console.error('Error:', message.error);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (error) {
    // Not JSON, handle as plain text
    console.log('Plain text message:', data);
  }
});
```

### Message Filtering

```javascript
// Only process specific message types
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  // Ignore heartbeats
  if (message.type === 'heartbeat') {
    return;
  }
  
  // Ignore pings
  if (message.type === 'ping') {
    pm.websocket.send(JSON.stringify({ type: 'pong' }));
    return;
  }
  
  // Process other messages
  console.log('Message:', message);
});
```

### Message Queue

```javascript
// Store messages in queue
const messageQueue = pm.variables.get('messageQueue') || [];

pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  messageQueue.push(message);
  pm.variables.set('messageQueue', messageQueue);
  
  console.log(`Queue size: ${messageQueue.length}`);
});

// Process queue later
const queue = pm.variables.get('messageQueue') || [];
queue.forEach(msg => {
  // Process message
  console.log('Processing:', msg);
});
```

---

## Message Patterns

### Request/Response Pattern

Simulate HTTP-like behavior:

```javascript
// Generate request ID
const requestId = Date.now().toString();

// Send request
pm.websocket.send(JSON.stringify({
  type: 'request',
  id: requestId,
  action: 'getUser',
  params: { userId: '123' }
}));

// Wait for response
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'response' && message.id === requestId) {
    console.log('Response received:', message.data);
  }
});
```

### Pub/Sub Pattern

Subscribe to topics:

```javascript
// Subscribe to channels
const channels = ['news', 'updates', 'notifications'];

channels.forEach(channel => {
  pm.websocket.send(JSON.stringify({
    type: 'subscribe',
    channel: channel
  }));
});

// Handle messages by channel
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'notification') {
    console.log(`[${message.channel}] ${message.content}`);
  }
});

// Unsubscribe
pm.websocket.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'news'
}));
```

### Broadcast Pattern

Send to all connected clients:

```javascript
// Server broadcasts to all
// Client receives
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'broadcast') {
    console.log('Broadcast:', message.content);
    console.log('From:', message.sender);
  }
});
```

---

## Real-World Examples

### Example 1: Chat Application

**Connect:**
```
wss://chat.example.com/room/lobby
```

**Send message:**
```json
{
  "type": "message",
  "text": "Hello everyone!",
  "user": "{{username}}",
  "timestamp": "{{$timestamp}}"
}
```

**Receive message:**
```json
{
  "type": "message",
  "id": "msg-123",
  "text": "Welcome!",
  "user": "admin",
  "timestamp": 1713264000000
}
```

**Handle typing indicator:**
```javascript
// Send typing start
pm.websocket.send(JSON.stringify({
  type: 'typing',
  user: pm.variables.get('username'),
  status: 'start'
}));

// Send typing stop (after 3 seconds)
setTimeout(() => {
  pm.websocket.send(JSON.stringify({
    type: 'typing',
    user: pm.variables.get('username'),
    status: 'stop'
  }));
}, 3000);
```

### Example 2: Live Stock Updates

**Connect:**
```
wss://stream.binance.com:9443/ws/btcusdt@trade
```

**No subscription needed** - Starts streaming immediately.

**Receive updates:**
```json
{
  "e": "trade",
  "E": 1713264000000,
  "s": "BTCUSDT",
  "t": 12345,
  "p": "50000.00",
  "q": "0.001",
  "b": 88,
  "a": 50,
  "T": 1713264000000,
  "m": true,
  "M": true
}
```

**Process:**
```javascript
let trades = [];

pm.websocket.on('message', (data) => {
  const trade = JSON.parse(data);
  
  // Store last 100 trades
  trades.push(trade);
  if (trades.length > 100) {
    trades.shift();
  }
  
  // Calculate average price
  const avgPrice = trades.reduce((sum, t) => sum + parseFloat(t.p), 0) / trades.length;
  console.log(`Average price: $${avgPrice.toFixed(2)}`);
  
  // Alert on large trades
  if (parseFloat(trade.q) > 1.0) {
    console.log(`🚨 Large trade: ${trade.q} BTC at $${trade.p}`);
  }
});
```

### Example 3: Real-time Notifications

**Connect:**
```
wss://api.example.com/notifications?token={{authToken}}
```

**Subscribe to user notifications:**
```json
{
  "type": "subscribe",
  "userId": "{{userId}}"
}
```

**Receive notification:**
```json
{
  "type": "notification",
  "id": "notif-123",
  "title": "New Message",
  "body": "You have a new message from John",
  "timestamp": 1713264000000,
  "priority": "high"
}
```

**Handle:**
```javascript
pm.websocket.on('message', (data) => {
  const notification = JSON.parse(data);
  
  if (notification.type === 'notification') {
    // Log notification
    console.log(`📬 ${notification.title}: ${notification.body}`);
    
    // Send acknowledgment
    pm.websocket.send(JSON.stringify({
      type: 'ack',
      notificationId: notification.id
    }));
    
    // Store for later
    const notifications = pm.collectionVariables.get('notifications') || [];
    notifications.push(notification);
    pm.collectionVariables.set('notifications', notifications);
  }
});
```

### Example 4: Game Updates

**Connect:**
```
wss://game.example.com/match/{{matchId}}?player={{playerId}}
```

**Send player action:**
```json
{
  "type": "action",
  "action": "move",
  "position": {
    "x": 100,
    "y": 250
  },
  "timestamp": "{{$timestamp}}"
}
```

**Receive game state:**
```json
{
  "type": "state",
  "players": [
    {
      "id": "player1",
      "position": { "x": 100, "y": 250 },
      "health": 100
    },
    {
      "id": "player2",
      "position": { "x": 300, "y": 150 },
      "health": 85
    }
  ],
  "timestamp": 1713264000000
}
```

---

## Message Testing

### Test Message Structure

```javascript
pm.test("Message has correct structure", () => {
  const message = JSON.parse(pm.websocket.lastMessage);
  
  pm.expect(message).to.have.property('type');
  pm.expect(message).to.have.property('data');
  pm.expect(message).to.have.property('timestamp');
});
```

### Test Message Content

```javascript
pm.test("Message contains expected data", () => {
  const message = JSON.parse(pm.websocket.lastMessage);
  
  pm.expect(message.type).to.equal('update');
  pm.expect(message.data).to.be.an('object');
  pm.expect(message.data.temperature).to.be.a('number');
});
```

### Test Message Timing

```javascript
// Track message arrival time
const messageTimestamps = [];

pm.websocket.on('message', (data) => {
  const now = Date.now();
  messageTimestamps.push(now);
  
  // Check frequency (should be max 1 per second)
  if (messageTimestamps.length > 1) {
    const lastTime = messageTimestamps[messageTimestamps.length - 2];
    const interval = now - lastTime;
    
    pm.expect(interval).to.be.at.least(1000);
  }
});
```

### Test Message Order

```javascript
let lastSequence = 0;

pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.sequence) {
    pm.test("Messages in order", () => {
      pm.expect(message.sequence).to.be.above(lastSequence);
    });
    
    lastSequence = message.sequence;
  }
});
```

### Test Echo Server

```javascript
// Send message
const sentMessage = 'Test message: ' + Date.now();
pm.websocket.send(sentMessage);

// Verify echo
pm.websocket.on('message', (data) => {
  pm.test("Echo matches sent message", () => {
    pm.expect(data).to.equal(sentMessage);
  });
});
```

---

## Message Validation

### Validate JSON Schema

```javascript
pm.websocket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    // Required fields
    pm.expect(message).to.have.property('type');
    
    // Type-specific validation
    if (message.type === 'user') {
      pm.expect(message).to.have.property('userId');
      pm.expect(message.userId).to.be.a('string');
    }
    
    if (message.type === 'update') {
      pm.expect(message).to.have.property('data');
      pm.expect(message.data).to.be.an('object');
    }
    
  } catch (error) {
    console.error('Invalid message:', error);
  }
});
```

### Validate Message Size

```javascript
pm.websocket.on('message', (data) => {
  const sizeKB = new Blob([data]).size / 1024;
  
  pm.test("Message size within limit", () => {
    pm.expect(sizeKB).to.be.below(1024); // < 1 MB
  });
  
  if (sizeKB > 100) {
    console.warn(`Large message: ${sizeKB.toFixed(2)} KB`);
  }
});
```

### Validate Timestamps

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.timestamp) {
    const messageTime = new Date(message.timestamp);
    const now = new Date();
    const diff = Math.abs(now - messageTime);
    
    pm.test("Timestamp is recent", () => {
      pm.expect(diff).to.be.below(5000); // Within 5 seconds
    });
  }
});
```

---

## Message Rate Limiting

### Track Message Rate

```javascript
const messageLog = [];

pm.websocket.on('message', (data) => {
  const now = Date.now();
  messageLog.push(now);
  
  // Keep only last minute
  const oneMinuteAgo = now - 60000;
  while (messageLog.length > 0 && messageLog[0] < oneMinuteAgo) {
    messageLog.shift();
  }
  
  const rate = messageLog.length / 60; // messages per second
  console.log(`Message rate: ${rate.toFixed(2)} msg/s`);
  
  // Alert if too high
  if (rate > 100) {
    console.warn('⚠️ High message rate!');
  }
});
```

### Throttle Outgoing Messages

```javascript
let lastSentTime = 0;
const minInterval = 100; // ms

function sendMessage(message) {
  const now = Date.now();
  const elapsed = now - lastSentTime;
  
  if (elapsed < minInterval) {
    // Wait before sending
    setTimeout(() => {
      pm.websocket.send(message);
      lastSentTime = Date.now();
    }, minInterval - elapsed);
  } else {
    // Send immediately
    pm.websocket.send(message);
    lastSentTime = now;
  }
}
```

---

## Message Persistence

### Save Messages to Collection

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  // Get existing messages
  const messages = pm.collectionVariables.get('messages') || [];
  
  // Add new message
  messages.push({
    data: message,
    receivedAt: Date.now()
  });
  
  // Keep only last 100
  if (messages.length > 100) {
    messages.shift();
  }
  
  // Save
  pm.collectionVariables.set('messages', messages);
});
```

### Export Messages

```javascript
// Get all saved messages
const messages = pm.collectionVariables.get('messages') || [];

// Convert to CSV
const csv = messages.map(msg => {
  return `"${msg.receivedAt}","${msg.data.type}","${JSON.stringify(msg.data)}"`;
}).join('\n');

// Log or save
console.log('CSV Export:\n' + csv);
```

### Load Previous Messages

```javascript
// On connect, load last session
const previousMessages = pm.collectionVariables.get('messages') || [];

console.log(`Loaded ${previousMessages.length} previous messages`);

previousMessages.forEach(msg => {
  console.log(`[${new Date(msg.receivedAt).toISOString()}]`, msg.data);
});
```

---

## Advanced Patterns

### Message Batching

```javascript
// Batch messages to reduce overhead
const batch = [];
const batchSize = 10;
const batchInterval = 1000; // 1 second

function addToBatch(message) {
  batch.push(message);
  
  if (batch.length >= batchSize) {
    sendBatch();
  }
}

function sendBatch() {
  if (batch.length === 0) return;
  
  pm.websocket.send(JSON.stringify({
    type: 'batch',
    messages: batch
  }));
  
  batch.length = 0; // Clear batch
}

// Send batch every interval
setInterval(sendBatch, batchInterval);
```

### Message Compression

```javascript
// For large messages (if server supports)
function compressMessage(message) {
  // Pseudo-code - actual compression would use library
  const compressed = {
    type: 'compressed',
    encoding: 'gzip',
    data: btoa(JSON.stringify(message)) // Base64 encode
  };
  
  return JSON.stringify(compressed);
}

pm.websocket.send(compressMessage(largeMessage));
```

### Message Replay

```javascript
// Store all messages
const messageHistory = [];

pm.websocket.on('message', (data) => {
  messageHistory.push({
    data: data,
    timestamp: Date.now()
  });
});

// Replay messages
function replayMessages(fromTime) {
  messageHistory
    .filter(msg => msg.timestamp >= fromTime)
    .forEach(msg => {
      console.log(`[REPLAY ${new Date(msg.timestamp).toISOString()}]`, msg.data);
    });
}

// Replay last 5 minutes
replayMessages(Date.now() - 300000);
```

---

## Error Handling

### Handle Parse Errors

```javascript
pm.websocket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    processMessage(message);
  } catch (error) {
    console.error('Failed to parse message:', error);
    console.error('Raw data:', data);
    
    // Try to handle as plain text
    if (typeof data === 'string') {
      console.log('Plain text message:', data);
    }
  }
});
```

### Handle Missing Fields

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  // Validate required fields
  if (!message.type) {
    console.error('Message missing type field:', message);
    return;
  }
  
  if (message.type === 'update' && !message.data) {
    console.error('Update message missing data:', message);
    return;
  }
  
  // Process valid message
  processMessage(message);
});
```

### Handle Server Errors

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'error') {
    console.error('Server error:', message.error);
    console.error('Error code:', message.code);
    
    // Handle specific errors
    switch (message.code) {
      case 'AUTH_FAILED':
        console.log('Reconnecting with new token...');
        reconnectWithAuth();
        break;
      
      case 'RATE_LIMIT':
        console.log('Rate limited, slowing down...');
        // Reduce message frequency
        break;
      
      case 'INVALID_MESSAGE':
        console.log('Last message was invalid');
        break;
    }
  }
});
```

---

## Using Variables in Messages

### Template Variables

```json
{
  "type": "message",
  "user": "{{username}}",
  "content": "{{messageContent}}",
  "roomId": "{{roomId}}",
  "timestamp": "{{$timestamp}}"
}
```

### Dynamic Variables from Scripts

```javascript
// Pre-send script
const userId = pm.environment.get('userId');
const sessionId = pm.variables.get('sessionId');

const message = {
  type: 'action',
  userId: userId,
  sessionId: sessionId,
  action: 'click',
  target: 'button-submit',
  timestamp: Date.now()
};

pm.websocket.message = JSON.stringify(message);
```

### Extract from Received Messages

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  // Save useful data as variables
  if (message.sessionId) {
    pm.environment.set('sessionId', message.sessionId);
  }
  
  if (message.userId) {
    pm.environment.set('userId', message.userId);
  }
  
  // Use in next message
  if (message.type === 'welcome') {
    pm.websocket.send(JSON.stringify({
      type: 'ready',
      sessionId: message.sessionId
    }));
  }
});
```

---

## Best Practices

### 1. Always Validate Messages

```javascript
pm.websocket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    if (!message.type) {
      throw new Error('Missing type field');
    }
    
    processMessage(message);
  } catch (error) {
    console.error('Invalid message:', error);
  }
});
```

### 2. Use Message Types

```javascript
// Structured message format
const message = {
  type: 'update',      // Required: message type
  data: { ... },       // Payload
  timestamp: Date.now(), // When sent
  id: generateId()     // Unique ID
};
```

### 3. Handle All Message Types

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  switch (message.type) {
    case 'welcome':
      handleWelcome(message);
      break;
    case 'update':
      handleUpdate(message);
      break;
    case 'error':
      handleError(message);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
});
```

### 4. Log Important Messages

```javascript
pm.websocket.on('message', (data) => {
  const message = JSON.parse(data);
  
  // Log errors, warnings, important events
  if (['error', 'warning', 'critical'].includes(message.type)) {
    console.log(`[${message.type.toUpperCase()}]`, message);
  }
});
```

### 5. Clean Up on Disconnect

```javascript
pm.websocket.on('close', () => {
  // Clear intervals
  const intervals = ['heartbeat', 'healthCheck', 'messageCheck'];
  intervals.forEach(name => {
    const interval = pm.variables.get(name);
    if (interval) {
      clearInterval(interval);
      pm.variables.unset(name);
    }
  });
  
  // Clear message queue
  pm.variables.unset('messageQueue');
});
```

---

## Troubleshooting

### Issue: Messages Not Received

**Problem:** Connected but no messages appear

**Solutions:**
- Check message handler is set up
- Verify server is sending messages
- Check message format (JSON vs text)
- Look for JavaScript errors in console

### Issue: Cannot Parse Messages

**Error:** `Unexpected token in JSON`

**Solutions:**
- Check if message is actually JSON
- Server might send plain text
- Message might be incomplete
- Try `console.log` raw message first

### Issue: Message Queue Overload

**Problem:** Too many messages causing performance issues

**Solutions:**
- Process messages asynchronously
- Implement message batching
- Filter unwanted messages
- Limit stored message history

---

## Next Steps

- **[Connecting](connecting.md)** - Learn connection management
- **[Test Scripts](../../advanced/test-scripts.md)** - Test WebSocket messages
- **[Variables](../../concepts/variables.md)** - Use variables in messages
- **[Collection Runner](../../advanced/collection-runner.md)** - Automate WebSocket tests

## Related Topics

- [Real-time APIs](../../concepts/realtime-apis.md)
- [GraphQL Subscriptions](../graphql/subscriptions.md)
- [Event-Driven Testing](../../advanced/event-testing.md)
