#!/bin/bash

echo "Building JSON-ASX CDN structure..."

mkdir -p latest
mkdir -p v1.0.0

# README
cat << 'EOF' > README.md
# JSON-ASX CDN
This is the CDN for JSON-ASX.
EOF

# root os.json
cat << 'EOF' > os.json
{ "meta": { "id": "json-asx", "version": "1.0.0" } }
EOF

# latest and versioned
cp os.json latest/os.json
cp os.json v1.0.0/os.json

# manifest
cat << 'EOF' > manifest.json
{ "name": "JSON-ASX", "start_url": "./index.html" }
EOF

# cdn manifest
cat << 'EOF' > cdn.manifest.json
{ "version": "1.0.0" }
EOF

# index.html (Visual Test)
cat << 'EOF' > index.html
<!doctype html>
<html>
<body>
<h1>JSON-ASX CDN</h1>
<pre id="out"></pre>
<script>
fetch('./latest/os.json')
  .then(r => r.json())
  .then(j => { document.getElementById('out').textContent = JSON.stringify(j, null, 2); });
</script>
</body>
</html>
EOF

echo "Build complete."
