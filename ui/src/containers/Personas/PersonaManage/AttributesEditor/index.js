import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { Map } from 'immutable';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { compose, withProps, setPropTypes, withState } from 'recompose';
import { withModels } from 'ui/utils/hocs';
import AddTextIconButton from 'ui/components/TextIconButton/AddTextIconButton';
import NewRow from './NewRow';
import SavedRow from './SavedRow';
import styles from './styles.css';

const enhance = compose(
  setPropTypes({
    personaId: PropTypes.string.isRequired,
  }),
  withProps(({ personaId }) => ({
    filter: new Map({ personaId }),
    schema: 'personaAttribute',
    first: 100,
    sort: new Map({ _id: -1 }),
  })),
  withModels,
  withState('isNewAttributeVisible', 'changeNewAttributeVisibility', false),
  withStyles(styles)
);

const render = ({
  personaId,
  models,
  isNewAttributeVisible,
  changeNewAttributeVisibility,
  addModel,
}) => {
  const handleNewRowAdd = (key, value) => {
    const props = new Map({ key, value, personaId });
    addModel({ props });
  };
  const handleNewRowCancel = () => {
    changeNewAttributeVisibility(false);
  };
  const handleShowNewRow = () => {
    changeNewAttributeVisibility(true);
  };
  return (
    <div>
      <div className={styles.buttons}>
        <AddTextIconButton text="Add Attribute" onClick={handleShowNewRow} />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.td}>Name</th>
            <th className={styles.td}>Value</th>
            <th className={classNames(styles.td, styles.actions)}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!isNewAttributeVisible ? null : (
            <NewRow onAdd={handleNewRowAdd} onCancel={handleNewRowCancel} />
          )}
          {models.map(model => (
            <SavedRow
              id={model.get('_id')}
              key={model.get('_id')} />
          )).valueSeq()}
        </tbody>
      </table>
    </div>
  );
};

export default enhance(render);
