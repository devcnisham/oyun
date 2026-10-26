# modules

Code grouped per product (`web`, `partner`, `admin`) plus `shared`. Each has `frontend`, `backend`, `database` and `lib` folders where it needs them. Rules and placement guide: `docs/PROJECT-STRUCTURE.md`.

`web`, `partner` and `admin` must not import each other. Anything two of them need lives in `shared`.
