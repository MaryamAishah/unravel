import React, { useEffect, useState, useRef } from "react";
import "./unravel.css";

export default function UnravelApp() {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`# Example:
for i in range(3):
    print(i)
`);
  const [explanations, setExplanations] = useState([]);
  const [runOutput, setRunOutput] = useState("");
  const [error, setError] = useState(null);
  const [highlightLine, setHighlightLine] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Loading Python runtime...");
  const stdoutRef = useRef("");

  useEffect(() => {
    async function loadPyodideAndPackages() {
      try {
        setStatusMsg("Downloading Pyodide...");
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        setPyodide(py);
        setLoading(false);
        setStatusMsg("Python runtime ready.");
      } catch (e) {
        console.error("Pyodide load failed:", e);
        setStatusMsg("Failed to load Python runtime. Check your network.");
        setLoading(false);
      }
    }

    if (!window.loadPyodide) {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      s.onload = loadPyodideAndPackages;
      s.onerror = () => {
        setStatusMsg("Failed to load Pyodide script.");
        setLoading(false);
      };
      document.head.appendChild(s);
    } else {
      loadPyodideAndPackages();
    }
  }, []);


  function explainLine(line) {
    const t = line.trim();
if (!t)
  return "Blank line: used to separate logical sections and make the code easier to read.";

if (t.startsWith("#"))
  return "Comment: a human-readable note ignored by Python. Comments explain why something is done, helping future readers.";

if (/^from\s+\w+/.test(t) || /^import\s+\w+/.test(t))
  return "Import statement: brings in a module or specific functions so you can use pre-built tools and utilities.";

if (/^def\s+\w+\s*\(/.test(t))
  return "Function definition: declares a named block of reusable logic. Call the function later to perform that task.";

if (/^class\s+\w+/.test(t))
  return "Class definition: creates a blueprint for objects that bundle data (attributes) and behavior (methods).";

if (/^for\s+/.test(t))
  return "For-loop: repeats the indented block for each item in a sequence such as a list or range.";

if (/^while\s+/.test(t))
  return "While-loop: repeats as long as a condition stays true; make sure the condition becomes false eventually.";

if (/^if\s+/.test(t))
  return "If statement: checks a condition and runs the following block when the condition is true.";

if (/^elif\s+/.test(t))
  return "Elif: an additional condition checked if previous if or elif branches were false.";

if (/^else:/.test(t))
  return "Else: fallback branch that runs when none of the preceding conditions evaluated to true.";

if (/^\s*except\b/.test(t))
  return "Except catches an error and allows your program to recover, preventing crashes.";

if (/^\s*try\s*:/.test(t))
  return "Try block: runs code that might cause an error so you can handle it safely.";

if (/^\s*finally\s*:/.test(t))
  return "Finally runs no matter what happened before it, useful for clean-up steps.";

if (/range\s*\(/.test(t))
  return "This line uses range to produce a sequence of numbers, often used to control loop counts.";

if (/input\s*\(/.test(t))
  return "Input asks the user to type something so the program can react to their answer.";

if (/len\s*\(/.test(t))
  return "Len returns the number of items in a list, string or other collection.";

if (/^print\s*\(/.test(t))
  return "Print: displays text or values in the console. Useful for results and simple debugging.";

if (/^\[.*\]$/.test(t.trim()) && !/:/.test(t))
  return "This line creates a list, an ordered collection of items.";

if (/^\{.*\}$/.test(t.trim()) && t.includes(":"))
  return "This line creates a dictionary, which stores data as key-value pairs.";

if (/^\(.*\)$/.test(t.trim()) && !t.includes("="))
  return "This line creates a tuple, which is like a list but cannot be changed after creation.";

if ((/\[.+\]|\{.+\}|\(.+\)/.test(t)) && /:/.test(t))
  return "Working with lists, dictionaries or tuples helps organize groups of values for easier access.";

if (/\w+\[.+\]/.test(t) && !/for/.test(t))
  return "This accesses a specific element inside a list or string using its index.";

if (/[\+\-\*\/%]/.test(t) && !/^print/.test(t))
  return "This line performs a mathematical operation, letting your program calculate values instead of hard-coding results.";

if (/==|!=|<=|>=|<|>/.test(t))
  return "This line compares two values to determine whether a condition is true.";

if (/\band\b|\bor\b|\bnot\b/.test(t))
  return "This line uses boolean logic to combine conditions for more precise decisions.";

if (/^\s*pass\s*$/.test(t))
  return "Pass acts as a placeholder that tells Python to do nothing.";

if (/^\s*break\s*$/.test(t))
  return "Break stops the nearest loop immediately.";

if (/^\s*continue\s*$/.test(t))
  return "Continue skips the rest of the current loop cycle and moves to the next.";

if (/\w+\.\w+\s*\(/.test(t))
  return "This is a method call, meaning a function that belongs to an object is being used.";

if (/\w+\s*\(.+\)/.test(t))
  return "Function call: executes a function that may return a value.";

if (/return\s+/.test(t))
  return "Return: exits a function and optionally provides a value back to the caller.";

if (/return/.test(t) && (/for /.test(t) || /while /.test(t)))
  return "Returning inside a loop ends both the loop and the function.";

if (/=/.test(t) && !/==/.test(t))
  return "Assignment: stores a value into a variable so you can reuse it later in the program.";

if (/^\w+\s*$/.test(t))
  return "This looks like a variable reference, which means the program is retrieving the value stored inside that name.";

return "Python statement: performs an operation that contributes to the program's behavior.";
  }

  function produceLineByLineExplanations(src) {
    return src.split("\n").map((ln, i) => ({
      lineno: i + 1,
      code: ln,
      explanation: explainLine(ln),
    }));
  }

  function friendlyErrorMessage(raw) {
  if (!raw) return null;
  const r = String(raw);


 const match = r.match(/File "<string>", line (\d+)/);
const lineInfo = match ? ` (Line ${match[1]})` : "";

    if (/SyntaxError/.test(r))
      return `Syntax error${lineInfo}: Python couldn't parse part of your code. Check missing colons, parentheses, or indentation.`;
    if (/NameError/.test(r)) {
      const v = (r.match(/NameError: name '(.+?)' is not defined/) || [])[1];
      return v
        ? `Name error${lineInfo}: '${v}' is not defined. Did you misspell it or forget to assign it?`
        : `Name error${lineInfo}: a name was used before it was defined.`;
    }
    if (/TypeError/.test(r))
      return `Type error${lineInfo}: an operation received a value of the wrong type (e.g., adding text to a number).`;
    if (/IndexError/.test(r))
      return `Index error${lineInfo}: tried to access an item outside a list/string range. Check lengths and indices.`;
    if (/IndentationError/.test(r))
      return `Indentation error${lineInfo}: Python relies on indentation to group code. Use consistent spaces (recommended).`;
 
    if (/KeyError/.test(r))
    return `Key error${lineInfo}: you're trying to access a dictionary key that doesn't exist. Double-check key names.`;

  if (/ValueError/.test(r))
    return `Value error${lineInfo}: a function received a value of the right type but wrong format. Example: converting 'abc' to int.`;
  if (/ZeroDivisionError/.test(r))
    return `Zero division error${lineInfo}: you're dividing by zero. Adjust your logic or check inputs before dividing.`;


  if (/AttributeError/.test(r))
    return `Attribute error${lineInfo}: you're trying to access an attribute or method that doesn't exist on this object.`;


  if (/FileNotFoundError/.test(r))
    return `File not found${lineInfo}: Python couldn't locate the file you're trying to open.`;
  return `Runtime error${lineInfo}: ${r}`;
  }


  async function runCode() {
    setError(null);
    setRunOutput("");
    setExplanations(produceLineByLineExplanations(code));

    if (!pyodide) {
      setStatusMsg("Python runtime not available.");
      return;
    }

    setStatusMsg("Running code in sandbox...");

    try {
      stdoutRef.current = "";
      const jsPrint = (s) => {
        stdoutRef.current += String(s).replace(/\r/g, "") + "\n";
      };

      pyodide.globals.set("js_print", jsPrint);

pyodide.globals.set("js_input", (msg) => {
  const result = prompt(msg || "");
  return result === null ? "" : String(result);
});

await pyodide.runPythonAsync(`
import sys

class JSWriter:
    def write(self, s):
        if s and str(s).strip():
            js_print(s)

sys.stdout = JSWriter()
sys.stderr = JSWriter()

def input(prompt=""):
    return js_input(prompt)
`);


      try {
        await pyodide.runPythonAsync(code);
        setRunOutput((stdoutRef.current || "(no output)").trim());
        setStatusMsg("Execution finished.");
      } catch (runErr) {
        const friendly = friendlyErrorMessage(runErr);
        setError(friendly);
        setRunOutput((stdoutRef.current || "(no output due to error)").trim());
        setStatusMsg("Execution finished with errors.");
      }
    } catch (e) {
  console.error(e);


  const match = String(e).match(/line (\d+)/);
  if (match) {
    setHighlightLine(Number(match[1]));
  } else {
    setHighlightLine(null);
  }

  setError("Unexpected failure while running code.");
  setStatusMsg("Execution failed.");
}

  }

  function quickFixSuggestions(friendly) {
    if (!friendly) return [];
    const suggestions = [];
    if (friendly.includes("Syntax error")) {
      suggestions.push("Check for missing ':' at the end of control lines (if/for/while/def/class).");
      suggestions.push("Ensure parentheses and quotes are balanced and indents match.");
    }
    if (friendly.includes("Name error")) {
      suggestions.push("Check spelling of variable/function names and define them before use.");
      suggestions.push("Make sure you imported the module that provides the name, if needed.");
    }
    if (friendly.includes("Indentation error")) {
      suggestions.push("Use 4 spaces per indent level and avoid mixing tabs and spaces.");
    }
    if (friendly.includes("Type error")) {
      suggestions.push("Print values and their types with type(x) to diagnose incorrect types.");
    }
    if (friendly.includes("Index error")) {
      suggestions.push("Verify list/string lengths and ensure indices are within range.");
    }
    return suggestions;
  }

  return (
    <div className="unravel-root">
      <header className="unravel-header">
        <div className="brand">
          <h1>Unravel</h1>
          <h2 className="tag">Your Coding Partner</h2>
        </div>
        <div className="status">{statusMsg}</div>
      </header>

      <main className="unravel-main">
        <section className="panel left">
          <div className="panel-head">
            <h2>Python Code</h2>
            <div className="hint">Paste code below. Unravel will explain and run it.</div>
          </div>

          <textarea
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            aria-label="Python code input"
          />

          <div className="controls">
            <button className="btn primary" onClick={runCode} disabled={loading}>
              Analyze & Run
            </button>
            <button
              className="btn"
              onClick={() => {
                setCode(`# Example:\nfor i in range(3):\n    print(i)\n`);
                setExplanations([]);
                setRunOutput("");
                setError(null);
              }}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="panel right">
          <div className="panel-head">
            <h2>Output</h2>
            <div className="hint">Program output and results appear here.</div>
          </div>

          <pre className="output-box" aria-live="polite">
            {runOutput || "(no output)"}
          </pre>

          <div className="panel-head" style={{ marginTop: 16 }}>
            <h3>Error/Hints</h3>
            <div className="hint">Beginner-friendly explanations for runtime or syntax errors.</div>
          </div>

          <div className={`error-box ${error ? "visible" : ""}`}>
            <div className="error-text">{error || "No errors detected."}</div>
            {error && (
              <ul className="fix-list">
                {quickFixSuggestions(error).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <section className="explain-section">
        <h2>Line-by-line explanation</h2>
        <div className="explain-list">
          {explanations.length === 0 && <div className="muted">No analysis yet. Click "Analyze & Run".</div>}
          {explanations.map((row) => (
            <div
  className="explain-row"
  key={row.lineno}
  style={
    highlightLine === row.lineno
      ? { background: "#fff8d6", border: "1px solid #f4c56d" }
      : {}
  }
>
              <div className="explain-left">
                <div className="line-number">{row.lineno}</div>
                <pre className="line-code">{row.code || "(blank)"}</pre>
              </div>
              <div className="explain-right">{row.explanation}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="unravel-footer">© {new Date().getFullYear()} Unravel</footer>
    </div>
  );
}
