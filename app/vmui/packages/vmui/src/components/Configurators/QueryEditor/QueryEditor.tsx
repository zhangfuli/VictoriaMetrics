import React, { FC, useRef, useState } from "preact/compat";
import { KeyboardEvent, useEffect } from "react";
import { ErrorTypes } from "../../../types";
import TextField from "../../Main/TextField/TextField";
import QueryEditorAutocomplete from "./QueryEditorAutocomplete";
import "./style.scss";
import { QueryStats } from "../../../api/types";
import { partialWarning, seriesFetchedWarning } from "./warningText";
import { AutocompleteOptions } from "../../Main/Autocomplete/Autocomplete";
import { useQueryDispatch } from "../../../state/query/QueryStateContext";
import useDeviceDetect from "../../../hooks/useDeviceDetect";

export interface QueryEditorProps {
  onChange: (query: string) => void;
  onEnter: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  value: string;
  oneLiner?: boolean;
  autocomplete: boolean;
  error?: ErrorTypes | string;
  stats?: QueryStats;
  label: string;
  disabled?: boolean
}

const QueryEditor: FC<QueryEditorProps> = ({
  value,
  onChange,
  onEnter,
  onArrowUp,
  onArrowDown,
  autocomplete,
  error,
  stats,
  label,
  disabled = false
}) => {
  const { isMobile } = useDeviceDetect();

  const [openAutocomplete, setOpenAutocomplete] = useState(false);
  const [caretPosition, setCaretPosition] = useState([0, 0]);
  const autocompleteAnchorEl = useRef<HTMLInputElement>(null);
  const queryDispatch = useQueryDispatch();

  const warning = [
    {
      show: stats?.seriesFetched === "0" && !stats.resultLength,
      text: seriesFetchedWarning
    },
    {
      show: stats?.isPartial,
      text: partialWarning
    }
  ].filter((w) => w.show).map(w => w.text).join("");

  if (stats) {
    label = `${label} (${stats.executionTimeMsec || 0}ms)`;
  }

  const handleSelect = (val: string) => {
    onChange(val);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = e;

    const value = (e.target as HTMLTextAreaElement).value || "";
    const isMultiline = value.split("\n").length > 1;

    const ctrlMetaKey = ctrlKey || metaKey;
    const arrowUp = key === "ArrowUp";
    const arrowDown = key === "ArrowDown";
    const enter = key === "Enter";

    // prev value from history
    if (arrowUp && ctrlMetaKey) {
      e.preventDefault();
      onArrowUp();
    }

    // next value from history
    if (arrowDown && ctrlMetaKey) {
      e.preventDefault();
      onArrowDown();
    }

    if (enter && openAutocomplete) {
      e.preventDefault();
    }

    // execute query
    if (enter && !shiftKey && (!isMultiline || ctrlMetaKey) && !openAutocomplete) {
      e.preventDefault();
      onEnter();
    }
  };

  const handleChangeFoundOptions = (val: AutocompleteOptions[]) => {
    setOpenAutocomplete(!!val.length);
  };

  const handleChangeCaret = (val: number[]) => {
    setCaretPosition(val);
  };

  useEffect(() => {
    queryDispatch({ type: "SET_AUTOCOMPLETE_QUICK", payload: false });
  }, [value]);

  return (
    <div
      className="vm-query-editor"
      ref={autocompleteAnchorEl}
    >
      <TextField
        value={value}
        label={label}
        type={"textarea"}
        autofocus={!isMobile}
        error={error}
        warning={warning}
        onKeyDown={handleKeyDown}
        onChange={onChange}
        onChangeCaret={handleChangeCaret}
        disabled={disabled}
        inputmode={"search"}
      />
      {autocomplete && (
        <QueryEditorAutocomplete
          value={value}
          anchorEl={autocompleteAnchorEl}
          caretPosition={caretPosition}
          onSelect={handleSelect}
          onFoundOptions={handleChangeFoundOptions}
        />
      )}
    </div>
  );
};

export default QueryEditor;
