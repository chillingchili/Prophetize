const { withMainActivity } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function addOnSaveInstanceStateOverride(activitySource) {
  if (activitySource.includes('onSaveInstanceState')) {
    return activitySource;
  }

  const importStatement = 'import android.os.Parcel';
  const overrideCode = `
  override fun onSaveInstanceState(outState: Bundle) {
      try {
          super.onSaveInstanceState(outState)
          val parcel = Parcel.obtain()
          parcel.writeBundle(outState)
          if (parcel.dataSize() > 500_000) {
              outState.clear()
          }
          parcel.recycle()
      } catch (_: Exception) { }
  }
`;

  let result = activitySource;

  if (!result.includes('import android.os.Parcel')) {
    const lastImportIndex = result.lastIndexOf('import ');
    const nextLineIndex = result.indexOf('\n', lastImportIndex);
    result = result.slice(0, nextLineIndex + 1) + importStatement + '\n' + result.slice(nextLineIndex + 1);
  }

  const onCreateMatch = result.match(/override\s+fun\s+onCreate\s*\(/);
  if (onCreateMatch) {
    const insertPos = onCreateMatch.index;
    const prevLineEnd = result.lastIndexOf('\n', insertPos - 2) + 1;
    result = result.slice(0, prevLineEnd) + overrideCode + '\n' + result.slice(prevLineEnd);
  }

  return result;
}

module.exports = function withTransactionTooLargeFix(config) {
  return withMainActivity(config, (props) => {
    if (props.modResults.contents) {
      props.modResults.contents = addOnSaveInstanceStateOverride(props.modResults.contents);
    }
    return props;
  });
};
