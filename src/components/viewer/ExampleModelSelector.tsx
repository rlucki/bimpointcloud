
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ExampleModelSelectorProps {
  onLoadExample: (url: string) => void;
}

const EXAMPLE_MODELS = [
  {
    name: "Basic IFC Sample (IfcOpenShell)",
    url: "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Others/01.ifc"
  },
  {
    name: "Duplex Sample (BuildingSMART)",
    url: "https://raw.githubusercontent.com/IFCjs/test-ifc-files/main/Duplex/Duplex_A_20110907.ifc"
  },
  {
    name: "Sample House (ThatOpenCompany)",
    url: "https://cdn.jsdelivr.net/gh/IFCjs/test-ifc-files@main/ifc-files/PajaritoOffice/Pajarito.ifc"
  },
  {
    name: "Samet Library (Simple)",
    url: "https://examples.ifcjs.io/models/ifc/SametLibrary.ifc"
  }
];

const ExampleModelSelector: React.FC<ExampleModelSelectorProps> = ({ onLoadExample }) => {
  const [selectedModelUrl, setSelectedModelUrl] = React.useState<string>("");

  const handleSelectModel = (value: string) => {
    setSelectedModelUrl(value);
  };

  const handleLoadExample = () => {
    if (selectedModelUrl) {
      onLoadExample(selectedModelUrl);
    }
  };

  return (
    <div className="bg-black/20 rounded-md p-4 mt-4 mb-2">
      <h3 className="text-sm font-medium mb-2">Load Example IFC Model</h3>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Select onValueChange={handleSelectModel}>
          <SelectTrigger className="w-full sm:w-[350px]">
            <SelectValue placeholder="Select an example model..." />
          </SelectTrigger>
          <SelectContent>
            {EXAMPLE_MODELS.map((model) => (
              <SelectItem key={model.url} value={model.url}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleLoadExample} 
          disabled={!selectedModelUrl}
          className="whitespace-nowrap"
        >
          Load Example
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        These models are loaded directly from public repositories. No upload required.
      </p>
    </div>
  );
};

export default ExampleModelSelector;
