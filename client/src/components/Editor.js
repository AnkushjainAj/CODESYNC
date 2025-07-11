import React, { useEffect, useRef } from "react";
import CodeMirror from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";

import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/comment/comment";
import "codemirror/addon/comment/continuecomment";

import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, code, onCodeChange }) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const editor = CodeMirror.fromTextArea(textareaRef.current, {
      mode: "javascript",  // ✅ JSON hata do
      theme: "dracula",
      autoCloseBrackets: true,
      matchBrackets: true,
      lineNumbers: true,
      extraKeys: {
        "Ctrl-/": "toggleComment",   // ✅ Shortcut added
        "Cmd-/": "toggleComment",
      },
    });

    editorRef.current = editor;
    editor.setSize(null, "100%");
    editor.setValue(code);

    editor.on("change", (instance, changes) => {
      const { origin } = changes;
      const updatedCode = instance.getValue();
      onCodeChange(updatedCode);

      if (origin !== "setValue") {
        socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code: updatedCode,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.getValue()) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null && code !== editorRef.current.getValue()) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef]);

  return (
    <div style={{ height: "600px" }}>
      <textarea ref={textareaRef}></textarea>
    </div>
  );
}

export default Editor;
