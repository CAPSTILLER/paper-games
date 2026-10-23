# Paper Games — holiday games for kids

Tic-Tac-Toe (Classic + Super), Dots & Boxes (10×10), and Hang Mannequin. Phone-first, no wallet.

- `npm i && npm run dev` · `npm test` · `npm run build`
- Theme: `?theme=halloween` (default picked by month in `src/themes/index.ts`). New holiday = new file in `src/themes/` + register it.
- Deep links: `?game=tictactoe|dots|mannequin&mode=2p|cpu&level=easy|medium&variant=classic|super&free=1`
- Each game: `src/games/<game>/logic.ts` (pure, tested) + `index.ts` exporting `mount(container, opts) -> { destroy, reset }` so a host such as a Mysbase room can render it on a table surface.
