package com.yeschef.api.DTO;

import java.util.List;

public class InstructionDTO {
    private int prepTime;
    private int cookTime;
    private List<InstructionStepDTO> steps;

    public static class InstructionStepDTO {
        private Integer stepNumber;
        private String stepDescription;

        public InstructionStepDTO() {}

        public InstructionStepDTO(Integer stepNumber, String stepDescription) {
            this.stepNumber = stepNumber;
            this.stepDescription = stepDescription;
        }

        public Integer getStepNumber() { return stepNumber; }
        public String getStepDescription() {return stepDescription; }

        public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }
        public void setStepDescription(String stepDescription) {this.stepDescription = stepDescription; }

    }

    public Integer getPrepTime() { return prepTime; }
    public Integer getCookTime() { return cookTime; }
    public List<InstructionStepDTO> getSteps() { return steps; }

    public void setPrepTime(int prepTime) { this.prepTime = prepTime; }
    public void setCookTime(int cookTime) { this.cookTime = cookTime; }
    public void setSteps(List<InstructionStepDTO> steps ) { this.steps = steps; }
}
