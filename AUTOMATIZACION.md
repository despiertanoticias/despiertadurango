# Publicación automática — instrucciones para la tarea programada

Esta tarea corre dos veces al día (mañana y tarde, hora del centro de México) y publica en despiertadurango.com.

## 1. Buscar las noticias
- Busca en la web las noticias más importantes de las últimas 12 horas en el estado de Durango (capital, La Laguna de Durango —Gómez Palacio y Lerdo—, sierra y resto de municipios), en México y en el mundo.
- Prioridad: Durango > La Laguna > Nacional > Política > Economía > Internacional > Deportes > Entretenimiento > Tecnología > Educación.
- Medios locales: El Siglo de Durango (secciones Durango y Regional), El Sol de Durango, El Siglo de Torreón (sección Gómez Palacio y Lerdo), El Sol de la Laguna, Contacto Hoy, Posta Durango, y los comunicados del Gobierno del Estado y de los ayuntamientos. Para lo nacional e internacional: Uno TV, Infobae México, Milenio, El Universal, La Jornada, El Financiero, Expansión y EFE.
- Abre cada nota para confirmar los datos.
- Antes de escribir, lee los títulos de `content/notas/` de los últimos 2 días y **no repitas** una nota que ya existe. Si un tema avanzó, escribe una nota nueva con el dato nuevo.

## 2. Escribir 20 notas
Crea **exactamente 20** archivos nuevos en `content/notas/`, uno por nota, con nombre `AAAA-MM-DD-titular-en-minusculas-con-guiones.json` (máximo 70 caracteres después de la fecha) y este formato:

```json
{
  "titulo": "Titular claro, en tus palabras",
  "seccion": "durango",
  "fecha": "2026-10-21T06:20",
  "resumen": "Dos o tres frases con los hechos: qué pasó, dónde, cifras y quién lo dijo.",
  "cuerpo": "",
  "imagen_tema": "catedral",
  "imagen": "",
  "credito": "",
  "fuentes": [{ "medio": "El Siglo de Durango", "enlace": "https://..." }],
  "destacada": false,
  "autor": "Redacción"
}
```

Reglas:
- `seccion`: durango, laguna, nacional, politica, economia, internacional, entretenimiento, tecnologia, educacion o deportes. **Al menos 8 de las 20 deben ser de Durango** (secciones `durango` o `laguna`, o temas del estado en `politica`, `economia`, `educacion` o `deportes`), y al menos 2 de `laguna`.
- Usa `laguna` para Gómez Palacio, Lerdo, Tlahualilo, Mapimí y la zona conurbada con Torreón.
- `fecha`: la hora de la ejecución en Durango. Usa minutos distintos para conservar el orden de importancia (la más importante con la hora más reciente).
- Marca `"destacada": true` en las 4 más importantes. Al menos 2 de ellas deben ser de Durango.
- `imagen_tema`: una de las claves de `assets/imagenes.js` que corresponda al tema (lugar o asunto). Si ninguna encaja, usa `catedral` para la capital, `gomez` para La Laguna o `zocalo` para el país.
- **Redacta todo con tus propias palabras.** No copies frases de los medios; como máximo, una cita breve (menos de 15 palabras) entre comillas si la frase exacta importa.
- **No inventes datos.** Cada cifra, nombre o fecha debe estar en la fuente enlazada. Si una fuente solo da el titular, escribe una nota breve con eso.
- Cada nota lleva al menos una fuente con su enlace real.
- Temas delicados (violencia, salud, política): tono neutral, sin adjetivos ni opiniones. En notas policiacas no publiques nombres de víctimas menores de edad.

## 3. Actualizar los datos del día
Edita `content/hoy.json` (mismo formato que ya tiene):
- `fecha` ("Miércoles 21 de octubre de 2026") y `actualizado` (hora).
- `clima`: máxima, mínima y pronóstico de la ciudad de Durango (SMN / Conagua, o la nota del clima de El Siglo de Durango). `ahora` solo si encuentras la temperatura actual; si no, déjalo vacío y se muestra la máxima. `laguna_max` y `laguna_min` para Gómez Palacio y Lerdo si hay dato. En `filas`, datos útiles como probabilidad de lluvia, viento o heladas (`ok` verde, `warn` amarillo, `bad` rojo).
- `carreteras`: solo tramos con reporte del día (Guardia Nacional Carreteras, Capufe, Protección Civil): cierres, deslaves, neblina o bancos de niebla en la Durango-Mazatlán, Durango-Torreón, Durango-Parral, Durango-Fresnillo, etc. Si no hay reportes, deja la lista vacía y el panel no aparece.
- `indicadores`: dólar (cierre o cotización del día) y precio promedio de Magna, Premium y Diésel en la capital.
- `agenda`: eventos, trámites o actividades del día o de los próximos días en el estado.
- Si no encuentras un dato, deja el anterior y no lo inventes.

## 4. Revisar y publicar
1. Ejecuta `node scripts/build.mjs`. Si marca errores, corrígelos.
2. Confirma que hay 20 archivos nuevos y que ninguno repite una nota anterior.
3. Haz commit en `main` con el mensaje `Noticias del AAAA-MM-DD (mañana|tarde)` y push. Netlify publica solo.
4. Envía al usuario un mensaje corto: cuántas notas se publicaron, los 4 titulares destacados y cualquier problema.
