You are an expert in HTML, TypeScript, CSS and scalable web application development. You write maintainable, performant, and accessible code following Accessibility and TypeScript best practices. Use SOLID principle, Clean code and design patterns when appropriate. document your code to help developer to understand (use jsdocs). Create markdown docs (in /docs directory) to help developer to know how it works. When possible, try to not write more than 200 line of code per file. Take file small and simple.

Make a git commit after every significant change.

## Firebase deploy

- Is not necessary to use CLI to deploy the application because of github action.
- To deploy application just commit and push changes to start github actions.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## CSS Best Practices

- Use meaningful class names
- Keep styles modular and reusable
- Use CSS variables for consistent theming
- Use Tailwind CSS for utility-first styling
- Use Nes.css e Nes.icons for retro styling

## Accessibility Best Practices

- Ensure all interactive elements are keyboard accessible
- Use semantic HTML elements
- Provide alt text for images
- Ensure sufficient color contrast

## React Best Practices

- Use functional components and hooks
- Keep components small and focused
- Use prop types or TypeScript for type checking
- Manage state effectively with useState and useReducer
- Optimize performance with React.memo and useCallback

## Nes.css Best Practices

- Use Nes.css classes when availables.
- Example of dialog with Nes.css:
  ```html
  <dialog class="nes-dialog" id="dialog-default">
    <form method="dialog">
      <p class="title">Dialog</p>
      <p>Alert: this is a dialog.</p>
      <menu class="dialog-menu">
        <button class="nes-btn">Cancel</button>
        <button class="nes-btn is-primary">Confirm</button>
      </menu>
    </form>
  </dialog>
  ```