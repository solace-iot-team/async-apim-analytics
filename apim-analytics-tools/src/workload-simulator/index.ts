import * as fs from 'fs';
import { WorkloadSimulator } from './workload-simulator';
import * as utils from './lib/utils'

/**
 * Creates and starts a PubSub workload simulator.
 * 
 * @param filename The name of the configuration file.
 */
const createAndStartWorkloadSimulator = async (filename: string): Promise<void> => {
  const configuration = utils.createConfigurationFromFile(filename);
  const simulator = await WorkloadSimulator.create(configuration);
  await simulator.start();
}

// MAIN

/** Usage information */
const printUsage = () => {
  console.log('Usage: workload-simulator <file>');
  console.log('');
  console.log('Creates and starts a PubSub workload simulator');
  console.log('');
  console.log('Options:');
  console.log('  <file>      The name of the PubSub workload simulator configuration file');
}

const checkFilename = (filename: string | undefined): string => {

  if (filename === undefined) {
    printUsage();
    process.exit(1);
  }
  if (!fs.existsSync(filename)) {
    console.log(`ERROR: file '${filename}' was not found.`);
    process.exit(1);
  }

  return filename;
}

const args = process.argv;
if (args.length < 3) {
  printUsage();
  process.exit(1);
}

(async () => {

  try {
    await createAndStartWorkloadSimulator(checkFilename(args[2]));
  } catch (error: any) {
    console.log(`ERROR: ${error.message}`);
    process.exit(2);
  }

})();
