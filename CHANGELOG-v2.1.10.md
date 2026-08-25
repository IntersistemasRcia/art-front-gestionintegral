# Changelog v2.1.10

**Release:** `release/v2.1.10` → `master` (producción)  
**Base anterior en producción:** `release/v2.1.7` (`a31d83d`)  
**Fecha:** 2026-08-25

## Resumen

Pase a producción con mejoras en **Comercializador → Pólizas** (jerarquía Grupo/Organizador/Comercializador, vigencia de pólizas para empresas), **Administración de comercializadores**, **Formularios RGRL/RAR**, **Denuncias**, **Usuarios/Roles** y ajustes en **Empleador/Cobertura**.

**27 archivos** modificados · **+647 / −248** líneas

---

## Comercializador — Pólizas

- Adaptación al nuevo contrato `srtComercializadorAsociado` nested con agrupación por `asociadoId`.
- Filtros de combos en cascada: Grupo → Organizador → Comercializador.
- Distinción de pólizas **Independientes** vs asignadas por Grupo/Organizador.
- Carga de empresas en login filtrada por **vigencia** (`vigenciaDesde` / `vigenciaHasta`).
- Utilidades: `srtComercializadorAsociadoUtils.ts`, `srtPolizaVigenciaUtils.ts`.

## Comercializador — Administración

- Manejo por tarea de administración de comercializadores (`Comercializador_Administracion_*`).

## Empleador

- Ajustes en endpoint de cobertura.
- CUIT visible en selector de empresa.
- RGRL/RAR: uso de `referenteDatosInterno` desde UsuarioLogueado.
- RGRL: selección de establecimiento al replicar formulario.
- RGRL: corrección de códigos en Responsables y Planilla C (Propio/Contratado).
- RGRL: conversión letra ↔ texto en cuestionario al cargar/guardar.
- RGRL: corrección de identificador de preguntas al guardar cuestionario.
- Excel: permitir fecha de último examen médico igual a la de ingreso.

## Denuncias

- Corrección de persistencia de datos en formulario de denuncia.

## Usuarios / Roles

- Creación de roles vía tarea `ADMROL_`.
- Extensión de roles gestionables por `ADMROL_` en filtro y listado de usuarios.

---

## Commits incluidos (desde `master`)

| Commit | Descripción |
|--------|-------------|
| `e55f603` | fix: filtrar pólizas por relación directa |
| `9547603` | fix: cargar empresas con pólizas vigentes |
| `f7fbdf9` | ajustes en polizas |
| `a4ca6ee` | ajsutes polizas |
| `1f6ec83` | Feat: manejo por tarea administracion de comercializadores |
| `6bd6b49` | Fix: ajustes empleador/cobertura endpoint |
| `b44ede1` | Feat: se le agrega cuit al selector de empresa |
| `77582dd` | fix: permitir fecha último examen médico = fecha ingreso (Excel) |
| `147c69e` | feat: seleccionar establecimiento al replicar RGRL |
| `b07ded9` | fix: códigos de representación en Responsables RGRL |
| `980e106` | fix: referenteDatosInterno UsuarioLogueado para rgrl y rar |
| `6c36b3c` | fix: conversión cuestionario RGRL letra/texto |
| `71c425a` | fix: valores invertidos Propio/Contratado Planilla C RGRL |
| `0b7c3f7` | Fix: identificador de preguntas al guardar cuestionario |
| `8f6959f` | Fix: Denuncias persistencia de datos |
| `06a4ec0` | feat: crear roles vía tarea ADMROL_ |
| `5c943b0` | feat: roles ADMROL_ en filtro y listado de usuarios |

*Incluye merges de PRs #243–#256.*
