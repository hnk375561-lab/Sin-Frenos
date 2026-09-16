# Estrategia de curación y responsive de la home

## Diferencia entre las secciones 3 y 5

La sección 3, **Archivo en movimiento**, es una vista dinámica del catálogo. Sus tarjetas se ordenan por el dato elegido por el visitante —potencia, precio o año— y pueden cambiar según el contenido disponible. Su objetivo es ayudar a explorar y comparar el archivo técnico sin imponer una selección editorial.

La sección 5, **Curaduría premium alternativa**, es una selección fija de cuatro modelos caros y visualmente distintivos: Porsche 911 Carrera, BMW M4, Lamborghini Urus y Rolls-Royce Cullinan. Su objetivo es ofrecer una lectura editorial de alternativas premium, separada del ranking dinámico de la sección 3. Los precios se muestran en USD como referencias internacionales declaradas en cada ficha; no se convierten automáticamente a ARS porque el proyecto no tiene una cotización argentina única y verificable para todos los modelos.

## Breakpoints definidos

| Contexto | Ancho | Comportamiento |
| --- | ---: | --- |
| Móvil | 375 px | Ficha Tesla en una columna; specs en dos columnas; footer en dos columnas compactas; CTA con altura mínima de 44 px. |
| Tablet | 768 px | Ficha Tesla mantiene imagen y datos apilados cuando el espacio es insuficiente; catálogo premium en dos columnas; footer en dos columnas. |
| Desktop | 1024 px o más | Ficha Tesla en dos columnas; catálogo premium en cuatro columnas; footer en cuatro columnas. |

Las imágenes reservan su aspect ratio antes de cargar y usan `object-cover` dentro de superficies con `overflow-hidden`, evitando CLS y recortes fuera del frame. Los controles táctiles usan `touch-action: manipulation`; los campos en dispositivos táctiles se mantienen en 16 px o más para evitar zoom automático.
