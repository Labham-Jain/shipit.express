import React, { FC } from 'react';

interface Props {
  name: string;
}

const App: FC<Props> = ({ name }) => {
  return (
    <div>
      Hello, {name}!
    </div>
  );
};

export default App;
