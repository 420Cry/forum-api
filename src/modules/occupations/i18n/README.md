# Occupation catalog translations (source of truth)

Bilingual review files — edit these to check EN ↔ VN side by side:

| File | Contents |
|------|----------|
| `occupations.json` | Full title keys |
| `occupation-domains.json` | Domains used in composition (`ai`, `backend`, …) |
| `occupation-roles.json` | Roles (`engineer`, `director`, …) |
| `occupation-seniority.json` | Seniority (`senior`, `junior`, …) |

Shape:

```json
{
  "ai_engineer": { "en": "AI Engineer", "vn": "Kỹ sư AI" }
}
```

`OccupationsService` loads these at runtime and serves localized `name` via
`GET /catalog/occupations?locale=vn`. Do not duplicate this catalog in forum-app.
