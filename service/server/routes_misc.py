import os
import secrets as _secrets
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import FileResponse, Response

from database import get_db_connection
from utils import hash_password as _hash_pw


def _resolve_skill_path(skill_name: Optional[str] = None):
    root = Path(__file__).parent.parent.parent
    candidates = []
    if skill_name:
        candidates.extend([
            root / 'skills' / skill_name / 'SKILL.md',
            root / 'skills' / skill_name / 'skill.md',
        ])
    else:
        candidates.extend([
            root / 'skills' / 'ai4trade' / 'SKILL.md',
            root / 'skills' / 'ai4trade' / 'skill.md',
        ])

    for path in candidates:
        if path.exists():
            return path
    return None


def register_misc_routes(app: FastAPI) -> None:
    @app.get('/api/setup/local-token')
    async def get_local_token():
        """
        Self-host mode: auto-create the default owner agent and return its token.
        Called once by the frontend on startup — no authentication required.
        """
        agent_name = os.getenv('DEFAULT_AGENT_NAME', 'owner').strip() or 'owner'
        agent_password = os.getenv('DEFAULT_AGENT_PASSWORD', 'localpassword').strip() or 'localpassword'

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, token FROM agents WHERE name = ?', (agent_name,))
        row = cursor.fetchone()

        if row:
            token = row['token'] or _secrets.token_urlsafe(32)
            if not row['token']:
                cursor.execute('UPDATE agents SET token = ? WHERE id = ?', (token, row['id']))
                conn.commit()
        else:
            token = _secrets.token_urlsafe(32)
            pw_hash = _hash_pw(agent_password)
            cursor.execute(
                'INSERT INTO agents (name, password_hash, token, cash) VALUES (?, ?, ?, ?)',
                (agent_name, pw_hash, token, 100000.0),
            )
            conn.commit()

        conn.close()
        return {'token': token, 'agent_name': agent_name}

    @app.get('/skill.md')
    @app.get('/SKILL.md')
    async def get_skill_index():
        skill_path = _resolve_skill_path()
        if skill_path is None:
            return {'error': 'main skill doc not found'}
        return Response(content=skill_path.read_text(encoding='utf-8'), media_type='text/markdown')

    @app.get('/skill/{skill_name}')
    async def get_skill_page(skill_name: str):
        skill_path = _resolve_skill_path(skill_name)
        if skill_path is not None:
            return Response(content=skill_path.read_text(encoding='utf-8'), media_type='text/markdown')
        return {'error': f"Skill '{skill_name}' not found"}

    @app.get('/skill/{skill_name}/raw')
    async def get_skill_raw(skill_name: str):
        skill_path = _resolve_skill_path(skill_name)
        if skill_path is not None:
            return skill_path.read_text(encoding='utf-8')
        return {'error': f"Skill '{skill_name}' not found"}

    @app.get('/')
    async def serve_index():
        index_path = Path(__file__).parent.parent / 'frontend' / 'dist' / 'index.html'
        if index_path.exists():
            return FileResponse(index_path)
        return {'message': 'AI-Trader API'}

    @app.get('/assets/{file}')
    async def serve_assets(file: str):
        asset_path = Path(__file__).parent.parent / 'frontend' / 'dist' / 'assets' / file
        if asset_path.exists():
            return FileResponse(asset_path)
        return Response(status_code=404)

    @app.get('/{path:path}')
    async def serve_spa_fallback(path: str):
        index_path = Path(__file__).parent.parent / 'frontend' / 'dist' / 'index.html'
        if index_path.exists():
            return FileResponse(index_path)
        return {'message': 'AI-Trader API'}
