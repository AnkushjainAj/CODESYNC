import React, { useEffect, useRef } from "react";
import CodeMirror from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";

// CodeMirror modes
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/mode/sql/sql";

// Addons
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/comment/comment";
import "codemirror/addon/comment/continuecomment";

import { ACTIONS } from "../Actions";

const LANGUAGE_MODES = {
  javascript: "javascript",
  python3: "python",
  cpp: "text/x-c++src",
  c: "text/x-csrc",
  java: "text/x-java",
  sql: "text/x-sql",
};

function Editor({ socketRef, roomId, code, onCodeChange, selectedLanguage }) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);

  // ✅ Initialize CodeMirror only once
  useEffect(() => {
    const editor = CodeMirror.fromTextArea(textareaRef.current, {
      mode: LANGUAGE_MODES[selectedLanguage] || "javascript",
      theme: "dracula",
      autoCloseBrackets: true,
      matchBrackets: true,
      lineNumbers: true,
      extraKeys: {
        "Ctrl-/": "toggleComment",
        "Cmd-/": "toggleComment",
      },
    });

    editorRef.current = editor;
    editor.setSize(null, "100%");
    editor.setValue(code || ""); // Set initial code

    // ✅ Local changes → Emit to socket
    editor.on("change", (instance, changes) => {
      const { origin } = changes;
      const updatedCode = instance.getValue();
      onCodeChange(updatedCode); // Update parent state

      if (origin !== "setValue") {
        socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code: updatedCode,
        });
      }
    });
  }, []); // ✅ Runs only once

  // ✅ Update language dynamically without resetting content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption(
        "mode",
        LANGUAGE_MODES[selectedLanguage] || "javascript"
      );
    }
  }, [selectedLanguage]);

  // ✅ External code updates from parent → Update editor
  useEffect(() => {
    if (
      editorRef.current &&
      code !== null &&
      code !== editorRef.current.getValue()
    ) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  // ✅ Listen for incoming code changes via socket
  useEffect(() => {
    if (!socketRef.current) return;

    const handleCodeChange = ({ code }) => {
      if (
        code !== null &&
        editorRef.current &&
        code !== editorRef.current.getValue()
      ) {
        editorRef.current.setValue(code);
      }
    };

    socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
    };
  }, [socketRef.current]);

  return (
    <div style={{ height: "600px" }}>
      <textarea ref={textareaRef}></textarea>
    </div>
  );
}

export default Editor;
