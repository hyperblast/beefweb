import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import React from 'react';
import PropTypes from 'prop-types';

export function useDefaultSensors()
{
    return useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );
}

export function SimpleSortableContext(props)
{
    return <DndContext sensors={props.sensors} onDragEnd={props.onDragEnd}>
        <SortableContext items={props.items} disabled={props.disabled}>
            {props.children}
        </SortableContext>
    </DndContext>;
}

SimpleSortableContext.propTypes = {
    sensors: PropTypes.object.isRequired,
    items: PropTypes.array.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};
