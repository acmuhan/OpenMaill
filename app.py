# -*- coding: utf-8 -*-
import os

from backend import create_app

app = create_app()


if __name__ == "__main__":
    app.run(
        debug=app.config.get("DEBUG", False),
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
    )
