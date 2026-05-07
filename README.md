# AlgoVisualizer v3.0

An interactive, high-performance web application designed to visualize and analyze the inner workings of sorting algorithms in real-time. Built with a focus on education and modern UI/UX principles, AlgoVisualizer transforms abstract logic into beautiful, responsive animations.

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

## ✨ Features

- **8 Core Sorting Algorithms**: Visualize Bubble, Insertion, Selection, Merge, Quick, Heap, Counting, and Radix Sort.
- **Race Mode**: A headless, high-speed execution mode that lets you pit two algorithms against each other to objectively compare processing times.
- **Auditory Feedback**: Uses the Web Audio API to map array values to oscillator frequencies, creating distinct auditory signatures for comparisons, swaps, and sorted elements.
- **Multiple Color Themes**: Hot-swap between Dark, Cyberpunk, Ocean, and Light modes with dynamic, animated backgrounds (Aurora gradients and glassmorphism).
- **Deep Controls**: Pause, play, or advance algorithms step-by-step to closely analyze their behavior.
- **Custom Data & Presets**: Input your own custom arrays or use presets like Reverse, Nearly Sorted, or Few Unique to see how different algorithms handle edge cases.
- **Analytics & Exporting**: Tracks array reads, writes, and execution time. Export your session's sort history directly to a CSV file.
- **Sharable States**: Generates custom URL parameters so you can share specific algorithm/array setups directly with others.

## 🛠️ Installation & Usage

Since AlgoVisualizer is built entirely with Vanilla JavaScript, HTML, and CSS, it requires zero build steps or dependencies.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Souven-Rej/AlgoVisuals.git
   ```
2. **Open the application**:
   Simply open `index.html` in any modern web browser.
   *(Alternatively, run a local development server like `npx http-server` for the best experience).*

## 🏎️ Algorithms Implemented

| Algorithm | Time Complexity (Avg) | Space Complexity | Stable? |
| :--- | :--- | :--- | :--- |
| **Bubble Sort** | O(n²) | O(1) | Yes |
| **Insertion Sort** | O(n²) | O(1) | Yes |
| **Selection Sort** | O(n²) | O(1) | No |
| **Merge Sort** | O(n log n) | O(n) | Yes |
| **Quick Sort** | O(n log n) | O(log n) | No |
| **Heap Sort** | O(n log n) | O(1) | No |
| **Counting Sort** | O(n + k) | O(n + k) | Yes |
| **Radix Sort** | O(nk) | O(n + k) | Yes |

## 🎨 UI Architecture

- **Vanilla CSS3 Custom Properties**: Entire theme engine driven by CSS variables and `color-mix()` functions, allowing for instant, seamless re-rendering without JS overhead.
- **Responsive Grid**: Flexbox and CSS Grid foundations ensure the tool is perfectly usable across desktop, tablet, and mobile breakpoints.
- **DOM Manipulations**: Optimized `requestAnimationFrame` and async-await patterns prevent main thread blocking during heavy visual updates.

---
*Created by Souven Rej.*
