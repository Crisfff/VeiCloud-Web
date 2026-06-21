from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "VeiCloud Music API funcionando 🎧",
        "endpoints": [
            "/music/search?q=shakira"
        ]
    })


@app.route("/music/search", methods=["GET"])
def search_music():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({
            "success": False,
            "query": "",
            "results": [],
            "message": "Falta el parámetro q"
        }), 400

    # Resultados de prueba por ahora.
    # Luego aquí conectaremos RapidAPI de verdad.
    results = [
        {
            "id": "demo_1",
            "title": f"{query} - Resultado 1",
            "artist": "VeiCloud Music Demo",
            "thumbnail": "",
            "duration": "3:21",
            "type": "song"
        },
        {
            "id": "demo_2",
            "title": f"{query} - Remix",
            "artist": "Sistema de prueba",
            "thumbnail": "",
            "duration": "2:58",
            "type": "song"
        },
        {
            "id": "demo_3",
            "title": f"{query} - Playlist",
            "artist": "Playlist sugerida",
            "thumbnail": "",
            "duration": "15 canciones",
            "type": "playlist"
        }
    ]

    return jsonify({
        "success": True,
        "query": query,
        "results": results,
        "message": "Resultados de prueba"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
