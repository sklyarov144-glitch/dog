# Dog Surf Rush — Audit and 3D Migration Plan (Phase 1)

## 1) Краткий аудит текущего проекта

Текущий проект — одностраничный Canvas MVP в одном файле `game.js` (~монолит). Архитектура годится для быстрого прототипа, но ограничивает:
- рост механик (boosters, moving obstacles, revive states);
- визуальный апгрейд до «premium 3D»;
- масштабирование UI/UX под desktop + mobile;
- управляемость производительности и расширяемость.

## 2) Конкретные проблемы

### Технические
1. **Монолитная логика**: рендер, геймплей, UI, input, save, ads смешаны в одном модуле.
2. **2D-ограничения**: отсутствие настоящей 3D-сцены, камер, материалов, света, глубины.
3. **Отсутствие data-driven spawn**: спавн на `Math.random` без контролируемой кривой сложности.
4. **Нет state machine уровня приложения**: состояния есть, но без формализованной архитектуры.
5. **Слабая подготовка под контент-пайплайн**: нет структуры для ассетов, анимаций, LOD, VFX.

### Gameplay/UX
1. Препятствия и collectables недостаточно читаемы на скорости и на мобильных.
2. Фронтальная «морда к игроку» в рантайме снижает ощущение движения вперёд.
3. Пейсинг и difficulty curve плоские; нет мягкого входа 20–30 сек.
4. Нет полноценного набора бустеров и миссий коммерческого уровня.
5. Нет чёткой системы безопасного маршрута (fairness guarantee).

### Визуал
1. Emoji/примитивы не соответствуют premium casual качеству.
2. Отсутствует PBR/stylized lighting, VFX, пост-эффекты.
3. Недостаточная глубина сцены и кинематографичность камеры.

## 3) Рекомендуемый стек

**Выбор: A) Migration to Three.js**

Почему Three.js:
- лёгкий веб-стек для Yandex Games;
- быстрый iteration loop;
- широкая экосистема (GLTF, postprocessing, particles);
- предсказуемый pipeline для mobile web.

Библиотеки (поэтапно):
- `three`
- `vite` (сборка/дев-сервер)
- `zustand` или лёгкий собственный store (опционально)
- `howler` (опционально) для аудио

## 4) Предлагаемая архитектура

- `App` (bootstrap, state machine, main loop)
- `RendererManager` (WebGLRenderer, resize, DPR cap)
- `SceneManager` (scene composition, lighting, sky/ocean)
- `CameraRig` (follow camera 3/4 rear)
- `InputManager` (keyboard/swipe/touch)
- `PlayerController` (lane movement, jump/slide, states)
- `LaneSystem` (3-lane world mapping)
- `ObstacleManager` (types, patterns, fairness)
- `CollectibleManager` (bone patterns, rarity)
- `BoosterManager` (magnet/shield/x2/speed/superjump)
- `UIManager` (menu/HUD/gameover/shop)
- `ProgressionManager` (difficulty curve, missions)
- `SaveManager` (local + cloud bridge)
- `AudioManager`
- `YandexGamesManager` (ads/leaderboard/payments)
- `PerformanceManager` (quality tiers, adaptive settings)

## 5) Пошаговый план миграции

### Phase 1 (текущий коммит)
- Аудит, дизайн-док и каркас модульной архитектуры.
- Перевод `index.html` на модульную точку входа.
- Добавление `src/` структуры и менеджеров-заготовок.

### Phase 2
- Подключение Three.js, базовая сцена, камера, 3 lane дорожки, placeholder-меши.
- Игровой цикл и чистый ECS-lite update pipeline.

### Phase 3
- Player states, jump/slide/lane switch, collision volumes.
- Новый obstacle/collectible spawn с fairness guarantee.

### Phase 4
- Premium visual pass: sunset sky, ocean shading, palms/islands cards, VFX.
- Большие читаемые препятствия/кости с контрастом и glow.

### Phase 5
- UI/UX polish: menu/HUD/gameover/shop/missions/leaderboard/settings/fullscreen.
- Mobile adaptation: safe-area, swipe tuning, text scaling.

### Phase 6
- Yandex Games hardening: rewarded/interstitial cadence, leaderboard sync.
- Performance pass (desktop/mobile tiers), QA checklist.

## 6) Файлы для изменения/создания

Изменить:
- `index.html` (module entrypoint)

Создать:
- `MIGRATION_AUDIT.md`
- `src/main.js`
- `src/core/App.js`
- `src/config/gameConfig.js`
- `src/managers/*` (renderer, input, ui, save, yandex, performance)
- `src/game/*` (player, lanes, obstacles, collectibles, boosters, progression)

> Примечание: dog reference image не добавлен в репозиторий в этом этапе. После получения файла — заведём asset pipeline (`assets/characters/dog_ref/`) и style guide для 3D-модели.
