// @flow strict
import * as React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import * as Immutable from 'immutable';

// $FlowFixMe: imports from core need to be fixed in flow
import connect from 'stores/connect';
// $FlowFixMe: imports from core need to be fixed in flow
import { MessageTablePaginator } from 'components/search';
// $FlowFixMe: imports from core need to be fixed in flow
import CombinedProvider from 'injection/CombinedProvider';
// $FlowFixMe: imports from core need to be fixed in flow
import MessageFieldsFilter from 'logic/message/MessageFieldsFilter';

import CombinedProvider from 'injection/CombinedProvider';
import MessageFieldsFilter from 'logic/message/MessageFieldsFilter';

import { TIMESTAMP_FIELD, Messages } from 'enterprise/Constants';
import { MessageTableEntry } from 'enterprise/components/messagelist';
import Field from 'enterprise/components/Field';

import { AdditionalContext } from 'enterprise/logic/ActionContext';
import { SelectedFieldsStore } from 'enterprise/stores/SelectedFieldsStore';
import FieldType from 'enterprise/logic/fieldtypes/FieldType';
import CustomPropTypes from 'enterprise/components/CustomPropTypes';
import { ViewStore } from 'enterprise/stores/ViewStore';
import { RefreshActions } from 'enterprise/stores/RefreshStore';
import MessagesWidgetConfig from 'enterprise/logic/widgets/MessagesWidgetConfig';

import styles from './MessageList.css';

const { InputsActions } = CombinedProvider.get('Inputs');

const MessageList = createReactClass({
  displayName: 'MessageList',

  propTypes: {
    fields: CustomPropTypes.FieldListType.isRequired,
    pageSize: PropTypes.number,
    config: PropTypes.instanceOf(MessagesWidgetConfig),
    data: PropTypes.shape({
      messages: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
    containerHeight: PropTypes.number,
    selectedFields: PropTypes.object,
    currentView: PropTypes.object,
  },

  getDefaultProps() {
    return {
      filter: '',
      pageSize: Messages.DEFAULT_LIMIT,
      editing: false,
      containerHeight: undefined,
      inputs: { inputs: [] },
      selectedFields: Immutable.Set(),
      currentView: { view: {}, activeQuery: undefined },
      config: undefined,
    };
  },

  getInitialState() {
    return {
      currentPage: 1,
      expandedMessages: Immutable.Set(),
    };
  },

  componentDidMount() {
    InputsActions.list();
  },

  _getSelectedFields() {
    if (this.props.config) {
      return Immutable.Set(this.props.config.fields);
    }
    return this.props.selectedFields;
  },

  _columnStyle(fieldName) {
    const selectedFields = Immutable.OrderedSet(this.props.fields);
    if (fieldName.toLowerCase() === 'source' && this._fieldColumns(selectedFields).size > 1) {
      return { width: 180 };
    }
    return {};
  },

  _fieldColumns(fields) {
    return fields.delete('message');
  },

  _toggleMessageDetail(id) {
    let newSet;
    if (this.state.expandedMessages.contains(id)) {
      newSet = this.state.expandedMessages.delete(id);
    } else {
      newSet = this.state.expandedMessages.add(id);
      RefreshActions.disable();
    }
    this.setState({ expandedMessages: newSet });
  },

  _fieldTypeFor(fieldName, fields) {
    return (fields.find(f => f.name === fieldName) || { type: FieldType.Unknown }).type;
  },

  render() {
    const { containerHeight, data, fields } = this.props;
    let maxHeight = null;
    if (containerHeight) {
      maxHeight = containerHeight - 60;
    }
    const pageSize = this.props.pageSize || 7;
    const messages = (data && data.messages) || [];
    const messageSlice = messages
      .slice((this.state.currentPage - 1) * pageSize, this.state.currentPage * pageSize)
      .map((m) => {
        return {
          fields: m.message,
          formatted_fields: MessageFieldsFilter.filterFields(m.message),
          id: m.message._id,
          index: m.index,
          highlight_ranges: m.highlight_ranges,
        };
      });
    const selectedFields = this._getSelectedFields();
    const selectedColumns = Immutable.OrderedSet(this._fieldColumns(selectedFields));
    const { activeQuery, view } = this.props.currentView;

    return (
      <span>
        <div className={styles.messageListPaginator}>
          <MessageTablePaginator currentPage={Number(this.state.currentPage)}
                                 onPageChange={newPage => this.setState({ currentPage: newPage })}
                                 pageSize={pageSize}
                                 position="top"
                                 resultCount={messages.length} />
        </div>

        <div className="search-results-table" style={{ overflow: 'auto', height: '100%', maxHeight: maxHeight }}>
          <div className="table-responsive">
            <div className={`messages-container ${styles.messageListTableHeader}`}>
              <table className="table table-condensed messages" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>
                      <Field interactive
                             name="Timestamp"
                             queryId={activeQuery}
                             type={this._fieldTypeFor(TIMESTAMP_FIELD, fields)} />
                    </th>
                    {selectedColumns.toSeq().map((selectedFieldName) => {
                      return (
                        <th key={selectedFieldName}
                            style={this._columnStyle(selectedFieldName)}>
                          <Field interactive
                                 type={this._fieldTypeFor(selectedFieldName, fields)}
                                 name={selectedFieldName}
                                 queryId={activeQuery}
                                 viewId={view.id} />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                {messageSlice.map((message) => {
                  const messageKey = `${message.index}-${message.id}`;
                  return (
                    <AdditionalContext.Provider key={messageKey}
                                                value={{ message }}>
                      <MessageTableEntry fields={fields}
                                         disableSurroundingSearch
                                         message={message}
                                         showMessageRow={selectedFields.contains('message')}
                                         selectedFields={selectedColumns}
                                         expanded={this.state.expandedMessages.contains(messageKey)}
                                         toggleDetail={this._toggleMessageDetail}
                                         highlight
                                         expandAllRenderAsync={false} />
                    </AdditionalContext.Provider>
                  );
                })}
              </table>
            </div>
          </div>
        </div>
      </span>
    );
  },
});

export default connect(MessageList,
  {
    selectedFields: SelectedFieldsStore,
    currentView: ViewStore,
  });
