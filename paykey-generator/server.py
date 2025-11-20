#!/usr/bin/env python3
"""
Straddle Paykey Demo Server
Uses BLAKE3 for cryptographic hashing via b3sum binary
"""

import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
import sys
import os
from datetime import datetime

class PaykeyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            # Health check endpoint for Render
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
        elif self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            # Use absolute path from script location
            script_dir = os.path.dirname(os.path.abspath(__file__))
            index_path = os.path.join(script_dir, 'index.html')
            with open(index_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()

    def do_HEAD(self):
        # Handle HEAD requests for health checks
        if self.path == '/health' or self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/generate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                result = generate_paykey(data)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))

            except Exception as e:
                print(f"ERROR: {type(e).__name__}: {str(e)}", file=sys.stderr)
                print(f"Request data: {post_data.decode('utf-8')[:500]}", file=sys.stderr)
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def blake3_hash(data_bytes):
    """Standard BLAKE3 hash"""
    result = subprocess.run(['b3sum', '--no-names'],
                          input=data_bytes,
                          capture_output=True,
                          check=True)
    return result.stdout.decode('utf-8').strip()

def blake3_keyed(data_bytes, key_bytes):
    """BLAKE3 keyed mode (MAC)"""
    import tempfile
    import os

    # Write data to temp file (b3sum keyed mode requires file input)
    with tempfile.NamedTemporaryFile(mode='wb', delete=False) as f:
        f.write(data_bytes)
        temp_path = f.name

    try:
        # Key comes from stdin, data from file
        result = subprocess.run(['b3sum', '--keyed', '--no-names', temp_path],
                              input=key_bytes,
                              capture_output=True,
                              check=True)
        return result.stdout.decode('utf-8').strip()
    finally:
        os.unlink(temp_path)

def blake3_derive_key(data_bytes, context):
    """BLAKE3 key derivation"""
    result = subprocess.run(['b3sum', '--derive-key', context, '--no-names'],
                          input=data_bytes,
                          capture_output=True,
                          check=True)
    return result.stdout.decode('utf-8').strip()

def generate_paykey(data):
    """Generate paykey from customer data"""

    # Extract inputs
    customer_json = data.get('customerJson', {})
    routing = data.get('routing', '')
    account = data.get('account', '')
    open_banking_token = data.get('openBankingToken', '')
    secret_key_hex = data.get('secretKey', '')

    # Validate
    if not customer_json:
        raise ValueError('Customer JSON is required')
    if not routing:
        raise ValueError('Routing number is required')
    if not account:
        raise ValueError('Account number is required')
    if len(secret_key_hex) != 64:
        raise ValueError('Secret key must be 64 hex characters (32 bytes)')

    # Create paykey data structure
    paykey_data = {
        'customer_id': customer_json.get('customer_details', {}).get('id', 'unknown'),
        'identity_review_id': customer_json.get('identity_details', {}).get('review_id', 'unknown'),
        'identity_status': customer_json.get('customer_details', {}).get('status', 'unknown'),
        'identity_decision': customer_json.get('identity_details', {}).get('decision', 'unknown'),
        'bank_routing': routing,
        'bank_account': account,
        'open_banking_token': open_banking_token or None,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }

    data_string = json.dumps(paykey_data, separators=(',', ':'))
    data_bytes = data_string.encode('utf-8')
    secret_key_bytes = bytes.fromhex(secret_key_hex)

    # 1. Standard BLAKE3 hash
    standard_hash = blake3_hash(data_bytes)

    # 2. BLAKE3 keyed mode (the paykey)
    keyed_hash = blake3_keyed(data_bytes, secret_key_bytes)

    # Format as Straddle paykey
    paykey_prefix = keyed_hash[:8]
    paykey_version = '02'
    paykey_core = keyed_hash[8:24]
    paykey = f"{paykey_prefix}.{paykey_version}.{paykey_core}"

    # 3. Key derivation
    vault_key = blake3_derive_key(data_bytes, 'vault-storage')
    analytics_key = blake3_derive_key(data_bytes, 'analytics')
    api_key = blake3_derive_key(data_bytes, 'partner-api')

    return {
        'paykey': paykey,
        'keyed_hash': keyed_hash,
        'standard_hash': standard_hash,
        'derived_keys': {
            'vault': vault_key[:32] + '...',
            'analytics': analytics_key[:32] + '...',
            'api': api_key[:32] + '...'
        },
        'input_data': data_string,
        'input_size': len(data_bytes)
    }

def main():
    # Read port from environment (Render provides PORT env var)
    port = int(os.environ.get('PORT', 8081))
    # Bind to 0.0.0.0 for Render (localhost only works locally)
    host = '0.0.0.0'

    server = HTTPServer((host, port), PaykeyHandler)
    print(f"🚀 Paykey Demo Server running on {host}:{port}")
    print(f"📋 Health check: http://{host}:{port}/health")
    print(f"Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        sys.exit(0)

if __name__ == '__main__':
    main()
