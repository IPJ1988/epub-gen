class Epub {
  options: any;
  output: string;

  constructor(options: any, output: string) {
    this.options = options;
    this.output = output;
    console.log({options});
    console.log({output});
    console.log('Every thing is gonna be OK.');
  }
}

export default Epub;