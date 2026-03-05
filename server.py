import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time

def create_handler(directory: str) -> type[http.server.SimpleHTTPRequestHandler]:
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(*args, directory=directory, **kwargs)
    return CustomHandler

def open_browser(server_url: str) -> None:
    # Wait for a moment to ensure the server has started
    time.sleep(1)
    # Open a new browser window and keep the controller
    browser_controller = webbrowser.get()
    browser_controller.open(server_url, new=1, autoraise=True)

def main(directory: str = os.getcwd(), port: int = 3000) -> None:

    # Set server URL and handler
    server_url = f"http://localhost:{port}"
    handler = create_handler(directory=directory)

    # Try to start the server
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Serving files from: {directory}")
            print(f"Server running on {server_url}")
            print("Press Ctrl+C to stop the server")

            # Start a thread to open the browser
            threading.Thread(target=open_browser, args=(server_url,), daemon=True).start()

            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()