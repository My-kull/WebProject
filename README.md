# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Qwen3.5 2B + TTS

This project includes quick aliases and scripts for `qwen3.5:2b` with a predefined prompt + text-to-speech output.

### Project command aliases

- Install Ollama (if missing), pull, and run model: `npm run qwen3:setup`
- Pull model: `npm run qwen3:pull`
- Interactive run: `npm run qwen3:run`
- Run predefined prompt and speak response: `npm run qwen3:speak`

### Shell aliases (optional)

To add terminal aliases (`qwen3setup`, `qwen3pull`, `qwen3run`, `qwen3speak`) to your shell:

```bash
echo 'source /home/teveti/WebProject/WebProject/scripts/qwen_aliases.sh' >> ~/.bashrc
source ~/.bashrc
```

### Predefined prompt file

Edit the prompt text here:

- `scripts/prompts/qwen3_predefined_prompt.txt`

Optional: override the prompt file at runtime:

```bash
PROMPT_FILE=/path/to/custom_prompt.txt npm run qwen3:speak
```
