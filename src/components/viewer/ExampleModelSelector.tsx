
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
      <h3 className="text-sm font-medium mb-2">Cargar modelo IFC de ejemplo</h3>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Select onValueChange={handleSelectModel}>
          <SelectTrigger className="w-full sm:w-[350px]">
            <SelectValue placeholder="Seleccione un modelo de ejemplo..." />
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
          Cargar Ejemplo
        </Button>
      </div>
      
      <div className="mt-3 p-2 bg-amber-950/30 border border-amber-600/30 rounded-md flex items-start gap-2">
        <AlertTriangle className="text-amber-500 h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-200/80">
          <span className="font-semibold">Nota:</span> Estos modelos se cargan directamente desde repositorios públicos y pueden tardar en cargarse dependiendo de su tamaño y su conexión a internet.
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Estos modelos se cargan directamente desde repositorios públicos. No es necesario subir archivos.
      </p>
    </div>
  );
};

export default ExampleModelSelector;
