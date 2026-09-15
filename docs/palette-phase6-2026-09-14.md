# Fase 6 — Nueva identidad cromática

## Dirección elegida

Se reemplazó por completo la identidad anterior de Paper, Ink, Oxide Red y Archive Green por una dirección deliberadamente eléctrica: **ultravioleta profundo** como base, **magenta eléctrico** como color transaccional dominante, **lima ácida** como señal de estado positivo y **cian señal** como contraste informativo.

La elección no intenta parecer editorial, institucional ni neutra. Busca que una visita rápida comunique movimiento, actividad, contacto directo y una decisión de compra o publicación inmediata. El magenta se repite en publicar, contactar, comprar, precio, favoritos activos, enlaces de acción y foco. El ultravioleta sostiene navegación, texto principal y superficies de alto contraste. La lima y el cian no compiten con la acción principal: distinguen estados positivos y de atención.

## Alcance aplicado

La remapificación se aplicó a los tokens globales y Tailwind, además de los colores directos introducidos en home, marketplace, auth, detalle de publicación, favoritos, wizard completo, fotos, mensajes, footer, header, hero SVG, calculadora, newsletter, PDFs y estados de fallback. No se modificaron layout, copy, rutas, sitemap, generación estática ni lógica de negocio.

Los badges de condición fueron remapeados deliberadamente: `normal` usa lima ácida, `atencion` usa cian y `grave` usa magenta con fondo rosado de alto contraste. Los colores de error y advertencia de superficies administrativas o legales se conservaron semánticamente donde cambiarlos habría confundido riesgo con acción de compra.

## Verificación

| Control | Resultado |
|---|---|
| TypeScript | OK |
| Tests | 458/458 aprobados |
| Lint | 0 errores; 4 warnings informativos por `<img>` remoto en listings estáticos y legacy |
| Build | OK |
| Páginas estáticas | 1.336 generadas |
| Rutas y sitemap | Sin cambios en esta fase |
| Datos y lógica | Sin cambios en esta fase |

## Spot-check pendiente

El entorno no ofrece una sesión visual de dispositivo real ni un test automatizado de contraste/regresión. Debe hacerse un spot-check final en 360–390 px y desktop, especialmente sobre magenta en fondos claros, lima en badges, foco de teclado, header móvil, CTA de publicar, tarjetas de listing, fotos sin imagen y estados de error. También conviene revisar brillo/glare en un teléfono real: la dirección está diseñada para ser intensa, pero la legibilidad real depende de la pantalla.
