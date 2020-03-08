import { FormHelperText } from "@material-ui/core"
import React from "react"
import Select, { components } from "react-select"
import { ValueType } from "react-select/src/types"
import { AnyChildren } from "../react-type-helpers"

export default function ListSelect<T>({
  items,
  value,
  onSelect,
  getLabel = (item: T) => ((item + "") as unknown) as string,
  getValue = (item: T) => ((item + "") as unknown) as string,
  placeholder,
  helpText,
  disabled,
  isItemDisabled,
  menuPlacement,
  minWidth = 200,
  customOptionRenderer,
}: {
  items: T[]
  value: T | undefined
  getLabel?: (item: T) => string | number
  getValue?: (item: T) => string | number
  onSelect?: (item: T) => void
  customOptionRenderer?: (item: T) => AnyChildren
  placeholder?: string
  helpText?: string
  disabled?: boolean
  isItemDisabled?: (item: T) => boolean
  menuPlacement?: "top" | "bottom"
  minWidth?: number
}) {
  const selected = value ? items.find(i => getValue(i) === getValue(value)) : undefined
  const textStyle = { fontWeight: "normal" as "normal", fontSize: "15px", color: "black" }
  return (
    <div style={{ minWidth, ...textStyle }}>
      <Select
        menuPlacement={menuPlacement}
        styles={{ menu: provided => ({ ...provided, width: "initial", ...textStyle }) }}
        components={{
          Option: props => {
            const optionData = (items.find(i => getValue(i) === props.data.value) as unknown) as T
            return (
              <components.Option {...props}>
                {customOptionRenderer ? customOptionRenderer(optionData) : getLabel(optionData)}
              </components.Option>
            )
          },
          SingleValue: props => {
            if (!selected) {
              throw new Error("Rendering single value without a selection")
            }
            return (
              <components.SingleValue {...props}>
                {customOptionRenderer ? customOptionRenderer(selected) : getLabel(selected)}
              </components.SingleValue>
            )
          },
        }}
        isDisabled={disabled}
        placeholder={placeholder}
        value={
          selected
            ? {
                value: getValue(selected),
                label: getLabel(selected),
              }
            : undefined
        }
        isOptionDisabled={
          isItemDisabled
            ? ({ value: v }) => {
                const o = items.find(i => getValue(i) === v)
                if (!o) {
                  throw new Error("This is not possible m8")
                }
                return isItemDisabled(o)
              }
            : undefined
        }
        options={items.map(i => ({
          label: getLabel(i),
          value: getValue(i),
        }))}
        onChange={(
          val: ValueType<{
            value: string | number
            label: string | number
          }>,
        ) => {
          if (!val) {
            throw new Error("No value selected")
          }
          if (Array.isArray(val)) {
            throw new Error("Multi-value unexpected")
          }
          const v = ((val as unknown) as {
            value: string | number
            label: string | number
          }).value
          const newSelected = items.find(i => getValue(i) === v)

          if (newSelected === undefined) {
            throw new Error("Selected value not found in haystack")
          }
          if (onSelect) {
            onSelect(newSelected)
          }
        }}
      />
      {helpText && <FormHelperText>{helpText}</FormHelperText>}
    </div>
  )
}
