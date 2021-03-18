import React, { useRef, useMemo, useState } from "react";
import { useTheme, createStyles, makeStyles } from "@material-ui/core/styles";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useFiretableContext } from "contexts/FiretableContext";
import { FieldType } from "constants/fields";
import { setTimeout } from "timers";

const useStyles = makeStyles((theme) =>
  createStyles({
    editorWrapper: { position: "relative", minWidth: 800 },
    resizeIcon: {
      position: "absolute",
      bottom: 0,
      right: 0,
      color: theme.palette.text.disabled,
    },

    saveButton: {
      marginTop: theme.spacing(1),
    },
  })
);

export default function CodeEditor(props: any) {
  const { handleChange, extraLibs, script, height = 400 } = props;
  const theme = useTheme();
  const monacoInstance = useMonaco();

  const [initialEditorValue] = useState(script ?? "");
  const { tableState } = useFiretableContext();
  const classes = useStyles();

  const editorRef = useRef<any>();

  function handleEditorDidMount(_, editor) {
    editorRef.current = editor;
  }

  const themeTransformer = (theme: string) => {
    switch (theme) {
      case "dark":
        return "vs-dark";
      default:
        return theme;
    }
  };

  useMemo(async () => {
    if (!monacoInstance) {
      // useMonaco returns a monaco instance but initialisation is done asynchronously
      // dont execute the logic until the instance is initialised
      return;
    }

    const firestoreDefsFile = await fetch(
      `${process.env.PUBLIC_URL}/firestore.d.ts`
    );
    // const firebaseAuthDefsFile = await fetch(
    //   `${process.env.PUBLIC_URL}/auth.d.ts`
    // );
    const firestoreDefs = await firestoreDefsFile.text();
    // const firebaseAuthDefs = await firebaseAuthDefsFile.text();
    // console.timeLog(firebaseAuthDefs);
    // monaco
    //   .init()
    //   .then((monacoInstance) => {
    try {
      monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
        firestoreDefs
      );
      // monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
      //   firebaseAuthDefs
      // );
      monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
        {
          noSemanticValidation: true,
          noSyntaxValidation: false,
        }
      );
      // compiler options
      monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions(
        {
          target: monacoInstance.languages.typescript.ScriptTarget.ES5,
          allowNonTsExtensions: true,
        }
      );
      if (extraLibs) {
        monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
          extraLibs.join("\n"),
          "ts:filename/extraLibs.d.ts"
        );
      }
      monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
        [
          "    /**",
          "     * utility functions",
          "     */",
          "declare namespace utilFns {",
          "    /**",
          "     * Sends out an email through sendGrid",
          "     */",
          `function sendEmail(msg:{from: string,
              templateId:string,
              personalizations:{to:string,dynamic_template_data:any}[]}):void {

              }`,
          "}",
        ].join("\n"),
        "ts:filename/utils.d.ts"
      );

      monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
        [
          "  const db:FirebaseFirestore.Firestore;",
          //     "  const auth:admin.auth;",
          "declare class row {",
          "    /**",
          "     * Returns the row fields",
          "     */",
          ...Object.keys(tableState?.columns!).map((columnKey: string) => {
            const column = tableState?.columns[columnKey];
            switch (column.type) {
              case FieldType.shortText:
              case FieldType.longText:
              case FieldType.email:
              case FieldType.phone:
              case FieldType.code:
                return `static ${columnKey}:string`;
              case FieldType.singleSelect:
                const typeString = [
                  ...column.config.options.map((opt) => `"${opt}"`),
                  //     "string",
                ].join(" | ");
                return `static ${columnKey}:${typeString}`;
              case FieldType.multiSelect:
                return `static ${columnKey}:string[]`;
              case FieldType.checkbox:
                return `static ${columnKey}:boolean`;
              default:
                return `static ${columnKey}:any`;
            }
          }),
          "}",
        ].join("\n"),
        "ts:filename/rowFields.d.ts"
      );
    } catch (error) {
      console.error(
        "An error occurred during initialization of Monaco: ",
        error
      );
    }
  }, [tableState?.columns, monacoInstance]);

  return (
    <>
      <div className={classes.editorWrapper}>
        <Editor
          theme={themeTransformer(theme.palette.type)}
          height={height}
          onMount={handleEditorDidMount}
          language="javascript"
          value={initialEditorValue}
          onChange={handleChange}
        />
      </div>
    </>
  );
}
