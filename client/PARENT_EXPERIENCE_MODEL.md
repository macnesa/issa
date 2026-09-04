# ISSA Parent Experience Model

This document locks the current parent-facing product model. It is not a backend schema.

## Product promise

The parent app should help a parent understand the child's current school context quickly without turning the child into a dashboard of metrics.

Technical complexity remains behind the interface. Parent-facing screens should expose facts, context, and chronology rather than internal modules.

## Primary navigation

Only three primary destinations are exposed:

1. **Hari ini** — an editorial current pulse: today's attendance, the next class routine, recent learning moments, contextual recent assessments, and a short school-news preview. It may scroll, but every section is a preview rather than a duplicate data module.
2. **Perjalanan** — one chronological learning story combining teacher notes, evidence, feedback, contextual assessments, and meaningful attendance moments.
3. **Jadwal** — weekly class routine plus school publications that are actually available from the existing API.

Attendance history and assessment-by-subject remain available as contextual detail routes, not primary navigation silos.

## Visual philosophy

Parent is part of the same ISSA family as Teacher Fieldwork but is not a visual clone.

Shared family DNA:
- deep ink and restrained green identity;
- typography and icon discipline;
- semantic status colors;
- accessibility and focus behavior;
- evidence-backed data wording.

Parent temperament:
- warmer and more spacious;
- tactile, expressive, and media-friendly;
- selective brutalist outlines, offset details, and strong color blocks;
- learning artifacts should feel like human records, not analytics cards.

Brutalist mechanics are used selectively. They should give learning moments physical character, not make every component equally loud.

## Data-truth rules

- Do not show a global average across subjects unless the backend provides a valid weighting/period contract.
- Assessment values remain attached to subject, assessment description, and date where available.
- Attendance summaries must state their time scope.
- Routine `Hadir` records do not need to dominate the learning journey; full attendance history remains available contextually.
- A missing resource is not silently presented as evidence that no record exists.
- School activity publication dates are not treated as future event dates unless the API actually provides that meaning.

## Preserve

The rewrite must preserve the existing parent session, read-only demo boundary, realtime record refresh, API contracts, evidence viewer, journal/evidence APIs, schedule mapping, and student overview mapping unless a separately verified defect requires change.
