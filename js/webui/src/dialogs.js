import React from 'react'
import ReactModal from 'react-modal'
import PropTypes from 'prop-types'
import { bindHandlers } from './utils.js'

const dialogTitles = Object.freeze({
    ok: 'OK',
    cancel: 'Cancel',
    apply: 'Apply',
    revert: 'Revert',
});

export function DialogButton(props)
{
    const { type, onClick, disabled } = props;

    return (
        <button
            className={'dialog-button dialog-button-' + type}
            onClick={onClick}
            disabled={disabled}>
            { dialogTitles[type] }
        </button>
    );
}

DialogButton.propTypes = {
    type: PropTypes.oneOf(['ok', 'cancel', 'apply', 'revert']).isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
};

export function ConfirmDialog(props)
{
    const { isOpen, title, message, onOk, onCancel } = props;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onCancel}
            className='dialog'
            overlayClassName='dialog-overlay'
            ariaHideApp={false}>
            <form className='dialog-content'>
                <div className='dialog-header'>{title}</div>
                <div className='dialog-body'>
                    <div className='dialog-row'>
                        <span className='dialog-label'>{message}</span>
                    </div>
                </div>
                <div className='dialog-footer'>
                    <DialogButton type='ok' onClick={onOk} />
                    <DialogButton type='cancel' onClick={onCancel} />
                </div>
            </form>
        </ReactModal>
    );
}

ConfirmDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};

export class InputDialog extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        bindHandlers(this);
    }

    handleChange(e)
    {
        this.props.onUpdate(e.target.value);
    }

    render()
    {
        const { isOpen, title, message, value, onOk, onCancel } = this.props;

        return (
            <ReactModal
                isOpen={isOpen}
                onRequestClose={onCancel}
                className='dialog'
                overlayClassName='dialog-overlay'
                ariaHideApp={false}>
                <form className='dialog-content'>
                    <div className='dialog-header'>{title}</div>
                    <div className='dialog-body'>
                        <div className='dialog-row'>
                            <label className='dialog-label' htmlFor='input'>{message}</label>
                            <input className='dialog-input' type='text' name='input' value={value} onChange={this.handleChange} />
                        </div>
                    </div>
                    <div className='dialog-footer'>
                        <DialogButton type='ok' onClick={onOk} />
                        <DialogButton type='cancel' onClick={onCancel} />
                    </div>
                </form>
            </ReactModal>
        );
    }
}

InputDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
};
