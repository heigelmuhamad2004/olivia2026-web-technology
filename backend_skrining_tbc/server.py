from app import app

if __name__ == '__main__':
    # PORT harus dari environment variable
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)