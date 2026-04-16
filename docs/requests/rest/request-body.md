# Request Body

Learn how to send data in the request body for POST, PUT, and PATCH requests.

---

## Overview

The **request body** contains data sent to the server. Used with:
- POST (create resources)
- PUT (replace resources)
- PATCH (update resources)
- DELETE (rarely, with body)

---

## Body Types

### JSON (application/json)

Most common format for APIs.

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "roles": ["admin", "editor"]
}
```

**Headers:**
```
Content-Type: application/json
```

### Form Data (application/x-www-form-urlencoded)

Key-value pairs, like HTML forms.

```
name=John+Doe&email=john%40example.com&age=30
```

### Multipart Form (multipart/form-data)

For file uploads and mixed data.

```
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

<binary data>
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="title"

My Document
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### Raw Text

Plain text, XML, or custom formats.

```xml
<?xml version="1.0"?>
<user>
  <name>John Doe</name>
  <email>john@example.com</email>
</user>
```

---

## Using Variables in Body

```json
{
  "email": "{{userEmail}}",
  "apiKey": "{{apiKey}}",
  "timestamp": "{{$timestamp}}"
}
```

## Dynamic Bodies

```javascript
// Pre-request
const body = {
  name: pm.variables.get('userName'),
  createdAt: new Date().toISOString()
};
pm.request.body.raw = JSON.stringify(body);
```

## Related Topics

- [POST Requests](post-requests.md)
- [PUT & PATCH](put-patch.md)
- [Headers](headers.md) - Content-Type
