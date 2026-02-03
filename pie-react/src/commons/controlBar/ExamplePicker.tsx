import React from 'react';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select, ItemRenderer } from '@blueprintjs/select';
import { examples } from '../../features/playground/examples';

interface ExamplePickerProps {
    onSelect: (code: string) => void;
    disabled?: boolean;
}

const exampleNames = Object.keys(examples);

const renderItem: ItemRenderer<string> = (item, { handleClick, modifiers }) => {
    return (
        <MenuItem
            active={modifiers.active}
            key={item}
            onClick={handleClick}
            text={item}
        />
    );
};

const ExamplePicker: React.FC<ExamplePickerProps> = ({ onSelect, disabled }) => {
    return (
        <Select<string>
            items={exampleNames}
            itemRenderer={renderItem}
            onItemSelect={(item) => onSelect(examples[item])}
            filterable={false}
            disabled={disabled}
        >
            <Button text="Examples" rightIcon="caret-down" disabled={disabled} />
        </Select>
    );
};

export default ExamplePicker;
